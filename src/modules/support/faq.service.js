import prisma from "../../config/database.js";
import HttpStatus from "../../utils/http-status.js";
import gcprError from "../../utils/http-error.js";

const INTRO_SETTING_KEY = "onboarding:intro";
const INTRO_SETTING_CATEGORY = "onboarding";

// Quick intro shown on first launch / offline. Covers beliefs around CP,
// what CP actually is, how the app helps, and how to open a support ticket.
// Stored in PlatformSetting so admins can edit copy without a deploy;
// the mobile app should cache this response for offline rural use.
const DEFAULT_INTRO = {
  version: 1,
  language: "en",
  title: "Understanding Cerebral Palsy — You Are Not Alone",
  updatedAt: null,
  sections: [
    {
      id: "beliefs",
      title: "Beliefs you may have heard",
      body: "In many communities, people say cerebral palsy is caused by witchcraft, a curse, punishment, or something the mother did wrong. Some say it is contagious or that nothing can be done. These beliefs are not true, and they can lead to shame, hiding children at home, and delayed care.",
    },
    {
      id: "what-it-is",
      title: "What cerebral palsy actually is",
      body: "Cerebral palsy (CP) is a condition that affects movement, posture, and muscle control. It happens because of injury to the developing brain — before, during, or shortly after birth (for example, difficult labour, lack of oxygen, severe jaundice, infections, or very premature birth). It is not contagious, it is not caused by witchcraft, and it is not the parents' fault. Every child with CP is different: some need a little support, others need daily therapy. With early support, physiotherapy, speech and feeding help, and regular follow-up, children can gain skills, go to school, and participate in family and community life.",
    },
    {
      id: "how-we-help",
      title: "How this app intends to help you",
      body: "GetMyNeuroCare connects you with verified therapists, nurses, and doctors — even from rural areas. You can: learn home exercises with pictures and videos, track your child's progress, book appointments or join video consultations when you have network, receive reminders, and message your care team. The app works offline: you can read lessons, complete tasks, and write down questions without internet. As soon as you get connectivity, the app pushes your saved data to the clinic server automatically.",
    },
    {
      id: "opening-a-ticket",
      title: "How to open a support ticket",
      body: "If you need help — using the app, understanding an exercise, or a concern about your child — open a ticket: go to Support > New Ticket, choose a category, write a short subject and describe the problem in your own words (any language). You can add a photo if needed and tap Submit. If you are offline, the ticket is saved on your phone and sent automatically once you have internet. Our team will reply in the app under Support > My Tickets, and you will get a notification.",
    },
  ],
  offlineNote:
    "Tip for low-network areas: open this intro and your lessons once while you have internet — they stay saved on your phone for offline reading.",
};

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

  // ─── Onboarding intro (public, offline-cacheable) ─────────────────────────

  static async getIntro() {
    const stored = await prisma.platformSetting.findUnique({
      where: { key: INTRO_SETTING_KEY },
    });
    const value = { ...DEFAULT_INTRO, ...(stored?.value || {}) };
    if (!value.updatedAt && stored?.updatedAt) {
      value.updatedAt = stored.updatedAt;
    }
    return value;
  }

  static async updateIntro(data) {
    const next = {
      ...DEFAULT_INTRO,
      ...(data || {}),
      version: (data?.version ?? DEFAULT_INTRO.version) || 1,
      updatedAt: new Date().toISOString(),
    };
    const saved = await prisma.platformSetting.upsert({
      where: { key: INTRO_SETTING_KEY },
      create: { key: INTRO_SETTING_KEY, value: next, category: INTRO_SETTING_CATEGORY },
      update: { value: next, category: INTRO_SETTING_CATEGORY },
    });
    return saved.value;
  }

  // Bundle intro + published FAQs in one call so the app can cache
  // everything it needs for offline use with a single request.
  static async getOfflineBundle(userRole = null) {
    const [intro, faqs] = await Promise.all([
      FaqService.getIntro(),
      FaqService.listFaqs({}, userRole),
    ]);
    return { intro, faqs, cachedAt: new Date().toISOString() };
  }
}
