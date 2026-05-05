import prisma from "../config/database.js";

const FAQ_SEED_DATA = [
  {
    category: { name: "Getting Started", description: "Learn how to use GetMyNeuroCare", sortOrder: 1 },
    faqs: [
      {
        question: "How do I create an account on GetMyNeuroCare?",
        answer: "Download the GetMyNeuroCare app or visit our web portal and tap 'Sign Up'. Choose your role (Caregiver or Service Provider), fill in your details, and verify your phone number via OTP. Complete your profile to unlock all features.",
        tags: ["account", "registration", "sign-up"],
        targetRoles: []
      },
      {
        question: "What is GetMyNeuroCare and who is it for?",
        answer: "GetMyNeuroCare is a specialised digital health platform designed for children with Cerebral Palsy (CP) and their support network. It connects caregivers with verified CP specialists including physiotherapists, occupational therapists, speech therapists, and paediatricians. The platform supports appointment booking, rehabilitation task tracking, clinical assessments, telehealth sessions, and care coordination.",
        tags: ["overview", "cerebral-palsy", "platform"],
        targetRoles: []
      },
      {
        question: "How do I complete my profile?",
        answer: "After registering, navigate to 'My Profile' and fill in all required sections. For caregivers, this includes your relationship to the child, occupation, and caregiver type (individual or group). For service providers, you will need to upload your professional licence, select your profession and facility details. A complete profile enables full access to all platform features.",
        tags: ["profile", "setup", "getting-started"],
        targetRoles: []
      }
    ]
  },
  {
    category: { name: "Appointments", description: "Booking and managing appointments", sortOrder: 2 },
    faqs: [
      {
        question: "How do I book an appointment with a service provider?",
        answer: "Go to 'Appointments' in the main menu and tap 'Book Appointment'. Select your CP patient, choose an available service provider, pick a date and time from their availability calendar, and confirm. The service provider will receive a notification and approve or reschedule the appointment. You will be notified once it is confirmed.",
        tags: ["appointment", "booking", "schedule"],
        targetRoles: ["CAREGIVER"]
      },
      {
        question: "Can I reschedule or cancel an appointment?",
        answer: "Service providers can reschedule appointments from their appointment management screen. If you need to cancel, please contact the service provider directly through the direct messaging feature. We recommend notifying at least 24 hours in advance to ensure other children can access that slot.",
        tags: ["appointment", "reschedule", "cancel"],
        targetRoles: []
      },
      {
        question: "How do I view my appointment history?",
        answer: "Navigate to 'Appointments' and use the filter tabs to view 'Upcoming', 'Completed', or 'All' appointments. You can filter by date or month to find specific records. Each appointment shows the provider, patient, date, time, and current status.",
        tags: ["appointment", "history", "records"],
        targetRoles: []
      }
    ]
  },
  {
    category: { name: "Rehab Tasks", description: "Managing and tracking rehabilitation tasks", sortOrder: 3 },
    faqs: [
      {
        question: "What are rehab tasks and how do they work?",
        answer: "Rehab tasks are daily exercises or activities prescribed by your child's service provider (e.g., physiotherapy exercises, speech practice routines). The provider creates tasks with detailed instructions, frequency, duration, and video demonstrations. Caregivers mark tasks as completed each day, and the provider tracks progress and adherence over time.",
        tags: ["rehab-tasks", "exercises", "therapy"],
        targetRoles: ["CAREGIVER"]
      },
      {
        question: "How do I mark a rehab task as completed?",
        answer: "Open the 'Rehab Tasks' section from the home screen. You will see today's pending tasks for your child. Tap on a task to view the full instructions and video, then tap 'Mark as Done' once completed. The completion is recorded and your service provider is notified of the progress update.",
        tags: ["rehab-tasks", "complete", "daily"],
        targetRoles: ["CAREGIVER"]
      },
      {
        question: "How do I assign rehab tasks to a patient?",
        answer: "As a service provider, navigate to the patient's profile and go to the 'Rehab Tasks' tab. Tap 'Assign New Task', fill in the title, instructions (you can add step-by-step guidance), frequency per day, duration in days, start date, and optionally attach a video demonstration URL. Tasks can also be generated from clinical referrals automatically.",
        tags: ["rehab-tasks", "assign", "provider"],
        targetRoles: ["SERVICE_PROVIDER"]
      }
    ]
  },
  {
    category: { name: "Telehealth", description: "Virtual consultations and telehealth sessions", sortOrder: 4 },
    faqs: [
      {
        question: "How do I join a telehealth session?",
        answer: "When a service provider schedules a telehealth session with you, you will receive a push notification and in-app notification with the session details. Navigate to 'Telehealth' in the app, find the scheduled session, and tap 'Join Session' at the scheduled time. Ensure your camera and microphone are enabled in your device settings before joining.",
        tags: ["telehealth", "video-call", "virtual"],
        targetRoles: []
      },
      {
        question: "Can telehealth sessions be recorded?",
        answer: "Session recordings are at the discretion of the service provider and require mutual consent from all participants. If a session is recorded, all participants are notified. Recordings are securely stored and accessible from the session details page to authorised participants for a limited period.",
        tags: ["telehealth", "recording", "consent"],
        targetRoles: []
      },
      {
        question: "What should I do if I experience technical issues during a telehealth session?",
        answer: "First, check your internet connection and ensure you have a stable connection (Wi-Fi recommended). If you lose connection, rejoin using the same session link. If the issue persists, use the in-app chat during the session to communicate with the provider. After the session, submit a support ticket from the 'Support' section describing the issue so our team can investigate.",
        tags: ["telehealth", "technical", "troubleshooting"],
        targetRoles: []
      }
    ]
  },
  {
    category: { name: "Account & Security", description: "Account settings and security", sortOrder: 5 },
    faqs: [
      {
        question: "How do I reset my password?",
        answer: "On the login screen, tap 'Forgot Password'. Enter the phone number or email address associated with your account. You will receive a one-time code (OTP) via SMS. Enter the code, set a new strong password (at least 8 characters with a mix of letters, numbers, and symbols), and confirm. For security, you will be logged out of all other devices.",
        tags: ["password", "reset", "security"],
        targetRoles: []
      },
      {
        question: "How do I update my contact information?",
        answer: "Go to 'Profile' > 'Edit Profile'. You can update your name, email, address, and digital address. Note that your registered phone number is your primary identifier and cannot be changed without contacting support. Profile photo can be updated from the same screen.",
        tags: ["profile", "contact", "update"],
        targetRoles: []
      },
      {
        question: "How do I enable push notifications?",
        answer: "Push notifications are essential for receiving appointment reminders, therapy task alerts, and messages from your care team. Go to 'Settings' > 'Notifications' in the app and ensure notifications are enabled. You may also need to allow notifications for the app in your device's system settings (iOS: Settings > GetMyNeuroCare > Notifications, Android: Settings > Apps > GetMyNeuroCare > Notifications).",
        tags: ["notifications", "push", "settings"],
        targetRoles: []
      }
    ]
  },
  {
    category: { name: "For Caregivers", description: "Guides specific to caregivers", sortOrder: 6 },
    faqs: [
      {
        question: "How do I add a CP patient to my account?",
        answer: "Navigate to 'My Patients' and tap 'Add Patient'. Fill in the child's full name, date of birth, gender, address, relationship to yourself, and school enrolment details. Once added, you can book appointments, track rehab tasks, and view assessments for this patient. Group caregivers (organisations) can manage multiple patients under their group profile.",
        tags: ["patient", "add", "caregiver", "child"],
        targetRoles: ["CAREGIVER"]
      },
      {
        question: "How do I communicate with my child's service provider?",
        answer: "Use the 'Messages' feature in the app to send direct messages to any service provider in your network. Navigate to 'Messages' > 'New Conversation' and search for the provider by name. You can share updates, ask questions, and receive advice. All messages are encrypted and stored securely.",
        tags: ["messaging", "communication", "provider"],
        targetRoles: ["CAREGIVER"]
      },
      {
        question: "How do I view my child's progress reports and assessments?",
        answer: "Go to the patient's profile and select the 'Assessments' tab to view all completed clinical assessments. Each assessment shows the tool used, date, scores, interpretation, and recommendations. The 'Progress' tab shows functional classification history (GMFCS, MACS, etc.) with trend indicators. You can download PDF reports for offline reference.",
        tags: ["progress", "assessment", "report", "caregiver"],
        targetRoles: ["CAREGIVER"]
      }
    ]
  },
  {
    category: { name: "For Service Providers", description: "Guides specific to service providers", sortOrder: 7 },
    faqs: [
      {
        question: "How do I get verified as a service provider?",
        answer: "After completing your registration and profile, your account will be in 'Pending Review' status. Our admin team will verify your professional licence details against the relevant regulatory body (AHPC, MDC, PHCG, or PSCG). This typically takes 1-3 business days. You will receive a notification once verified. Until verified, access to clinical features (assessments, referrals, task assignment) is restricted.",
        tags: ["verification", "licence", "provider", "registration"],
        targetRoles: ["SERVICE_PROVIDER"]
      },
      {
        question: "How do I set my availability for appointments?",
        answer: "Navigate to 'My Availability' from your profile menu. For each day of the week, set your available time slots by selecting the day, start time, and end time. You can set multiple slots per day (e.g., 9:00-12:00 and 14:00-17:00). Caregivers will only be able to book appointments within your set availability windows.",
        tags: ["availability", "schedule", "appointments", "provider"],
        targetRoles: ["SERVICE_PROVIDER"]
      },
      {
        question: "How do I conduct and submit a clinical assessment?",
        answer: "Navigate to 'Assessments' > 'New Assessment'. Select the patient, choose the appropriate assessment tool for your profession (e.g., GMFM-88 for physiotherapists, SLT CP Baseline for speech therapists), and complete all sections of the digital form. When finished, tap 'Submit Assessment' to generate a report. The system will automatically analyse the responses and generate scores, interpretations, and referral recommendations where applicable.",
        tags: ["assessment", "clinical", "tools", "provider"],
        targetRoles: ["SERVICE_PROVIDER"]
      }
    ]
  }
];

export async function seedFaqs() {
  try {
    const count = await prisma.faq.count();
    if (count > 0) {
      return; // Already seeded
    }

    WRITE.info("[FAQ Seed] Seeding initial FAQ data...");

    for (const section of FAQ_SEED_DATA) {
      const category = await prisma.faqCategory.upsert({
        where: { name: section.category.name },
        update: {},
        create: {
          name: section.category.name,
          description: section.category.description,
          sortOrder: section.category.sortOrder,
          isActive: true
        }
      });

      for (let i = 0; i < section.faqs.length; i++) {
        const faqData = section.faqs[i];
        await prisma.faq.create({
          data: {
            categoryId: category.id,
            question: faqData.question,
            answer: faqData.answer,
            tags: faqData.tags,
            targetRoles: faqData.targetRoles,
            sortOrder: i,
            isPublished: true
          }
        });
      }
    }

    WRITE.info("[FAQ Seed] FAQ seeding completed successfully");
  } catch (error) {
    WRITE.error("[FAQ Seed] FAQ seeding failed:", { error: error.message });
  }
}
