import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";

export default class FaqService {
  // ─── Public / User FAQ Operations ─────────────────────────────────────────

  static async listFaqs(query = {}, userRole = null) {
    const where = { isPublished: true };

    if (userRole) {
      where.OR = [
        { targetRoles: { isEmpty: true } },
        { targetRoles: { has: userRole } }
      ];
    }

    if (query.tag) {
      where.tags = { has: query.tag };
    }

    if (query.search) {
      const searchClause = {
        OR: [
          { question: { contains: query.search, mode: "insensitive" } },
          { answer: { contains: query.search, mode: "insensitive" } }
        ]
      };
      where.AND = [searchClause];
    }

    const faqs = await prisma.faq.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, sortOrder: true } }
      },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }]
    });

    // Group by category
    const grouped = {};
    for (const faq of faqs) {
      const catName = faq.category.name;
      if (!grouped[catName]) {
        grouped[catName] = {
          category: faq.category,
          faqs: []
        };
      }
      grouped[catName].faqs.push({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        tags: faq.tags,
        viewCount: faq.viewCount,
        helpfulCount: faq.helpfulCount,
        sortOrder: faq.sortOrder
      });
    }

    return Object.values(grouped);
  }

  static async listFaqCategories() {
    const categories = await prisma.faqCategory.findMany({
      where: { isActive: true },
      include: {
        _count: { select: { faqs: { where: { isPublished: true } } } }
      },
      orderBy: { sortOrder: "asc" }
    });
    return categories.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      sortOrder: c.sortOrder,
      faqCount: c._count.faqs
    }));
  }

  static async getFaq(faqId) {
    const faq = await prisma.faq.findUnique({
      where: { id: faqId },
      include: { category: { select: { id: true, name: true } } }
    });
    if (!faq) throw new gcprError(HttpStatus.NOT_FOUND, "FAQ not found");

    // Increment view count
    await prisma.faq.update({
      where: { id: faqId },
      data: { viewCount: { increment: 1 } }
    });

    return { ...faq, viewCount: faq.viewCount + 1 };
  }

  static async markHelpful(faqId) {
    const faq = await prisma.faq.findUnique({ where: { id: faqId } });
    if (!faq) throw new gcprError(HttpStatus.NOT_FOUND, "FAQ not found");

    return prisma.faq.update({
      where: { id: faqId },
      data: { helpfulCount: { increment: 1 } }
    });
  }

  static async searchFaqs(q) {
    if (!q || q.trim().length === 0) {
      throw new gcprError(HttpStatus.BAD_REQUEST, "Search query is required");
    }
    return prisma.faq.findMany({
      where: {
        isPublished: true,
        OR: [
          { question: { contains: q, mode: "insensitive" } },
          { answer: { contains: q, mode: "insensitive" } }
        ]
      },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { sortOrder: "asc" }
    });
  }

  // ─── Admin FAQ Operations ──────────────────────────────────────────────────

  static async adminListFaqs(query = {}) {
    const page = Math.max(1, parseInt(query.page ?? 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? 20, 10)));
    const skip = (page - 1) * limit;

    const where = {};
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.isPublished !== undefined) where.isPublished = query.isPublished === "true";

    const [total, faqs] = await Promise.all([
      prisma.faq.count({ where }),
      prisma.faq.findMany({
        where,
        include: { category: { select: { id: true, name: true } } },
        orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
        skip,
        take: limit
      })
    ]);

    return {
      data: faqs,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  static async createFaqCategory(data) {
    const exists = await prisma.faqCategory.findUnique({ where: { name: data.name } });
    if (exists) throw new gcprError(HttpStatus.CONFLICT, "A category with this name already exists");
    return prisma.faqCategory.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        sortOrder: data.sortOrder ?? 0
      }
    });
  }

  static async updateFaqCategory(id, data) {
    const cat = await prisma.faqCategory.findUnique({ where: { id } });
    if (!cat) throw new gcprError(HttpStatus.NOT_FOUND, "FAQ category not found");
    return prisma.faqCategory.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
      }
    });
  }

  static async deleteFaqCategory(id) {
    const cat = await prisma.faqCategory.findUnique({
      where: { id },
      include: { _count: { select: { faqs: true } } }
    });
    if (!cat) throw new gcprError(HttpStatus.NOT_FOUND, "FAQ category not found");
    if (cat._count.faqs > 0) {
      throw new gcprError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        "Cannot delete a category that has FAQs. Remove all FAQs first."
      );
    }
    await prisma.faqCategory.delete({ where: { id } });
    return { deleted: true };
  }

  static async createFaq(data) {
    const cat = await prisma.faqCategory.findUnique({ where: { id: data.categoryId } });
    if (!cat) throw new gcprError(HttpStatus.NOT_FOUND, "FAQ category not found");
    return prisma.faq.create({
      data: {
        categoryId: data.categoryId,
        question: data.question,
        answer: data.answer,
        tags: data.tags ?? [],
        targetRoles: data.targetRoles ?? [],
        sortOrder: data.sortOrder ?? 0,
        isPublished: false
      }
    });
  }

  static async updateFaq(id, data) {
    const faq = await prisma.faq.findUnique({ where: { id } });
    if (!faq) throw new gcprError(HttpStatus.NOT_FOUND, "FAQ not found");
    return prisma.faq.update({
      where: { id },
      data: {
        ...(data.question !== undefined && { question: data.question }),
        ...(data.answer !== undefined && { answer: data.answer }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.targetRoles !== undefined && { targetRoles: data.targetRoles }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId })
      }
    });
  }

  static async deleteFaq(id) {
    const faq = await prisma.faq.findUnique({ where: { id } });
    if (!faq) throw new gcprError(HttpStatus.NOT_FOUND, "FAQ not found");
    await prisma.faq.delete({ where: { id } });
    return { deleted: true };
  }

  static async publishFaq(id) {
    const faq = await prisma.faq.findUnique({ where: { id } });
    if (!faq) throw new gcprError(HttpStatus.NOT_FOUND, "FAQ not found");
    return prisma.faq.update({ where: { id }, data: { isPublished: true } });
  }

  static async unpublishFaq(id) {
    const faq = await prisma.faq.findUnique({ where: { id } });
    if (!faq) throw new gcprError(HttpStatus.NOT_FOUND, "FAQ not found");
    return prisma.faq.update({ where: { id }, data: { isPublished: false } });
  }
}
