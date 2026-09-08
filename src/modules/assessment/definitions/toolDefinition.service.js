/**
 * Assessment-tool definitions service (Group 5) — DB layer.
 *
 * Draft structure (sections/fields) is editable via the admin API.
 * publish() freezes an immutable AssessmentToolVersion snapshot; published
 * rows are never updated — edits publish a new version. Submissions validate
 * against and record the exact version used.
 */

import prisma from "../../../config/database.js";
import HttpStatus from "../../../utils/http-status.js";
import gcprError from "../../../utils/http-error.js";
import WRITE from "../../../utils/logger.js";
import {
  configToSnapshot,
  configToDefinitionMeta,
  validateSnapshotResponses,
  scoreSnapshotResponses,
  renderSnapshotAsForm,
} from "./toolSchema.js";
import { processAssessment } from "../../../services/assessment/assessment.service.js";
import {
  gmfm88Config,
  sltCpBaselineConfig,
  paediatricPhysiotherapyAssessmentConfig,
  otCpClinicalAssessmentConfig,
  cpProgramIntakeConfig,
  homeRehabPharmacyConfig,
  dietitianNutritionConsultationConfig,
} from "../../../config/tools/index.js";

const LEGACY_CONFIGS = [
  gmfm88Config,
  sltCpBaselineConfig,
  paediatricPhysiotherapyAssessmentConfig,
  otCpClinicalAssessmentConfig,
  cpProgramIntakeConfig,
  homeRehabPharmacyConfig,
  dietitianNutritionConsultationConfig,
];

const orderByOrder = { order: "asc" };

const draftInclude = {
  sections: { include: { fields: { orderBy: orderByOrder } }, orderBy: orderByOrder },
  versions: { orderBy: { version: "desc" }, take: 5 },
};

const snapshotFromDraft = (draft) => ({
  sections: (draft.sections ?? []).map((section) => ({
    code: section.code,
    title: section.title,
    description: section.description,
    order: section.order,
    fields: (section.fields ?? []).map((field) => ({
      fieldKey: field.fieldKey,
      order: field.order,
      label: field.label,
      helpText: field.helpText,
      fieldType: field.fieldType,
      options: field.options,
      validation: field.validation,
      scoringWeight: field.scoringWeight,
    })),
  })),
});

async function toolFieldKeys(toolId) {
  const sections = await prisma.assessmentToolSection.findMany({
    where: { toolId },
    select: { fields: { select: { fieldKey: true } } },
  });
  return new Set(sections.flatMap((s) => s.fields.map((f) => f.fieldKey)));
}

class ToolDefinitionService {
  // ─── One-time migration of the 7 legacy configs ──────────────────────────

  static async ensureToolsMigrated() {
    const count = await prisma.assessmentToolDefinition.count();
    if (count > 0) return { migrated: false };
    if (!ToolDefinitionService._migrating) {
      ToolDefinitionService._migrating = ToolDefinitionService.migrateLegacyConfigs().finally(() => {
        ToolDefinitionService._migrating = null;
      });
    }
    await ToolDefinitionService._migrating;
    return { migrated: true };
  }

  static async migrateLegacyConfigs() {
    for (const config of LEGACY_CONFIGS) {
      const meta = configToDefinitionMeta(config);
      try {
        const existing = await prisma.assessmentToolDefinition.findUnique({ where: { code: meta.code } });
        if (existing) {
          if (existing.currentVersion >= 1) continue;
          // Incomplete residue from an interrupted run (definition without
          // any published version): remove and re-migrate cleanly.
          WRITE.warn("[Tools] Removing incomplete definition residue", { code: meta.code });
          await prisma.assessmentToolDefinition.delete({ where: { id: existing.id } });
        }
        const definition = await prisma.assessmentToolDefinition.create({
          data: { ...meta, status: "DRAFT", createdBy: "legacy-migration" },
        });
      const snapshot = configToSnapshot(config);
      for (const section of snapshot.sections) {
        const created = await prisma.assessmentToolSection.create({
          data: {
            toolId: definition.id,
            order: section.order,
            code: section.code,
            title: section.title,
            description: section.description,
          },
        });
        for (const field of section.fields) {
          await prisma.assessmentToolField.create({
            data: {
              sectionId: created.id,
              fieldKey: field.fieldKey,
              order: field.order,
              label: field.label,
              helpText: field.helpText,
              fieldType: field.fieldType,
              options: field.options ?? undefined,
              validation: field.validation ?? undefined,
              scoringWeight: field.scoringWeight,
            },
          });
        }
      }
      await ToolDefinitionService.publishTool(definition.id, "legacy-migration");
      WRITE.info("[Tools] Migrated legacy config", { code: meta.code });
      } catch (error) {
        // Another process/instance won the race for this code (unique
        // violation) — its rows are the canonical ones, so skip ours.
        if (error?.code === "P2002") {
          WRITE.warn("[Tools] Legacy config already migrated concurrently, skipping", { code: meta.code });
          continue;
        }
        throw error;
      }
    }
  }

  // ─── Reads ───────────────────────────────────────────────────────────────

  static async listDefinitions() {
    await ToolDefinitionService.ensureToolsMigrated();
    return prisma.assessmentToolDefinition.findMany({
      orderBy: { code: "asc" },
      select: {
        id: true, code: true, name: true, status: true,
        applicableScales: true, allowedProfessions: true,
        scoringStrategy: true, currentVersion: true, updatedAt: true,
      },
    });
  }

  static async getDefinition(id) {
    const definition = await prisma.assessmentToolDefinition.findUnique({
      where: { id },
      include: draftInclude,
    });
    if (!definition) throw new gcprError(HttpStatus.NOT_FOUND, "Tool definition not found");
    return definition;
  }

  static async getPublishedTool(code) {
    await ToolDefinitionService.ensureToolsMigrated();
    const definition = await prisma.assessmentToolDefinition.findUnique({ where: { code } });
    if (!definition || definition.currentVersion < 1) {
      throw new gcprError(HttpStatus.NOT_FOUND, `No published version for tool: ${code}`);
    }
    const version = await prisma.assessmentToolVersion.findUnique({
      where: { toolId_version: { toolId: definition.id, version: definition.currentVersion } },
    });
    if (!version || version.status !== "PUBLISHED") {
      throw new gcprError(HttpStatus.NOT_FOUND, `No published version for tool: ${code}`);
    }
    return { definition, version };
  }

  static async previewTool(id) {
    const definition = await ToolDefinitionService.getDefinition(id);
    const published = definition.versions.find((v) => v.status === "PUBLISHED" && v.version === definition.currentVersion);
    const snapshot = published ? published.snapshot : snapshotFromDraft(definition);
    return {
      code: definition.code,
      name: definition.name,
      version: published ? published.version : 0,
      published: Boolean(published),
      applicableScales: definition.applicableScales,
      allowedProfessions: definition.allowedProfessions,
      ...renderSnapshotAsForm(snapshot),
    };
  }

  // ─── Draft CRUD ──────────────────────────────────────────────────────────

  static async createDraft(userId, data) {
    const existing = await prisma.assessmentToolDefinition.findUnique({ where: { code: data.code } });
    if (existing) throw new gcprError(HttpStatus.CONFLICT, "A tool with this code already exists");
    return prisma.assessmentToolDefinition.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description ?? null,
        applicableScales: data.applicableScales ?? [],
        allowedProfessions: data.allowedProfessions ?? [],
        scoringStrategy: data.scoringStrategy ?? "CUSTOM_FN_REF",
        customFnRef: data.customFnRef ?? null,
        status: "DRAFT",
        createdBy: userId ?? null,
      },
    });
  }

  static async updateDraft(id, data) {
    await ToolDefinitionService.getDefinition(id);
    return prisma.assessmentToolDefinition.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.applicableScales !== undefined && { applicableScales: data.applicableScales }),
        ...(data.allowedProfessions !== undefined && { allowedProfessions: data.allowedProfessions }),
        ...(data.scoringStrategy !== undefined && { scoringStrategy: data.scoringStrategy }),
        ...(data.customFnRef !== undefined && { customFnRef: data.customFnRef }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });
  }

  static async addSection(toolId, data) {
    await ToolDefinitionService.getDefinition(toolId);
    const order = data.order ?? (await prisma.assessmentToolSection.count({ where: { toolId } }));
    return prisma.assessmentToolSection.create({
      data: {
        toolId,
        order,
        code: data.code ?? null,
        title: data.title,
        description: data.description ?? null,
      },
    });
  }

  static async updateSection(sectionId, data) {
    return prisma.assessmentToolSection.update({
      where: { id: sectionId },
      data: {
        ...(data.order !== undefined && { order: data.order }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
  }

  static async deleteSection(sectionId) {
    await prisma.assessmentToolSection.delete({ where: { id: sectionId } });
    return { deleted: true };
  }

  static async addField(toolId, sectionId, data) {
    const section = await prisma.assessmentToolSection.findFirst({ where: { id: sectionId, toolId } });
    if (!section) throw new gcprError(HttpStatus.NOT_FOUND, "Section not found for this tool");
    const keys = await toolFieldKeys(toolId);
    if (keys.has(data.fieldKey)) {
      throw new gcprError(HttpStatus.CONFLICT, `fieldKey "${data.fieldKey}" already exists in this tool`);
    }
    const order = data.order ?? (await prisma.assessmentToolField.count({ where: { sectionId } }));
    return prisma.assessmentToolField.create({
      data: {
        sectionId,
        fieldKey: data.fieldKey,
        order,
        label: data.label,
        helpText: data.helpText ?? null,
        fieldType: data.fieldType,
        options: data.options ?? undefined,
        validation: data.validation ?? undefined,
        scoringWeight: data.scoringWeight ?? null,
      },
    });
  }

  static async updateField(fieldId, data) {
    if (data.fieldKey !== undefined) {
      throw new gcprError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "fieldKey is immutable once assigned — create a new field instead",
      );
    }
    return prisma.assessmentToolField.update({
      where: { id: fieldId },
      data: {
        ...(data.order !== undefined && { order: data.order }),
        ...(data.label !== undefined && { label: data.label }),
        ...(data.helpText !== undefined && { helpText: data.helpText }),
        ...(data.fieldType !== undefined && { fieldType: data.fieldType }),
        ...(data.options !== undefined && { options: data.options }),
        ...(data.validation !== undefined && { validation: data.validation }),
        ...(data.scoringWeight !== undefined && { scoringWeight: data.scoringWeight }),
      },
    });
  }

  static async deleteField(fieldId) {
    await prisma.assessmentToolField.delete({ where: { id: fieldId } });
    return { deleted: true };
  }

  // ─── Publish (freeze immutable version) ──────────────────────────────────

  static async publishTool(id, publishedBy = null) {
    const draft = await ToolDefinitionService.getDefinition(id);
    if (draft.sections.length === 0) {
      throw new gcprError(HttpStatus.UNPROCESSABLE_ENTITY, "Cannot publish a tool with no sections");
    }
    const snapshot = snapshotFromDraft(draft);
    const version = draft.currentVersion + 1;
    const published = await prisma.$transaction(async (tx) => {
      const row = await tx.assessmentToolVersion.create({
        data: {
          toolId: id,
          version,
          status: "PUBLISHED",
          scoringStrategy: draft.scoringStrategy,
          customFnRef: draft.customFnRef,
          allowedProfessions: draft.allowedProfessions,
          applicableScales: draft.applicableScales,
          snapshot,
          publishedAt: new Date(),
        },
      });
      await tx.assessmentToolDefinition.update({
        where: { id },
        data: { currentVersion: version, status: "PUBLISHED" },
      });
      return row;
    });
    WRITE.info("[Tools] Published tool version", { toolId: id, version, publishedBy });
    return published;
  }

  // ─── Submit path: validate + score against a published version ───────────

  static validateAgainstVersion(version, responses) {
    return validateSnapshotResponses(version.snapshot, responses);
  }

  static scoreAgainstVersion({ toolCode, version, responses }) {
    if (version.scoringStrategy === "CUSTOM_FN_REF") {
      // Exact legacy behavior via the registered scorer pipeline.
      return { kind: "custom", ...processAssessment({ toolCode, responses }) };
    }
    return { kind: "generic", result: scoreSnapshotResponses(version.snapshot, version.scoringStrategy, responses) };
  }
}

export default ToolDefinitionService;
