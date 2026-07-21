/*!
 * Edu Abroad Limited — Front-end Application Engine
 * ---------------------------------------------------
 * This file simulates a real backend (auth, users, documents, plans,
 * appointments) entirely inside the browser using localStorage, so the
 * whole site works end-to-end (signup -> login -> upload docs -> admin
 * review -> plan upgrade) without needing a server.
 *
 * IMPORTANT (read this before wiring up a real server):
 * To make this production-ready, swap the functions in the "DATA LAYER"
 * section below for real fetch() calls to your API. Every other page
 * only talks to window.EduAuth / window.EduData, so the UI code never
 * needs to change.
 */
(function (window) {
  "use strict";

  var DB_KEY = "eduabroad_db_v1";
  var SESSION_KEY = "eduabroad_session_v1";

  var DOCUMENT_TYPES = [
    { id: "passport", label: "Passport (Bio Page)", required: true },
    { id: "academic", label: "Academic Transcripts / Certificates", required: true },
    { id: "english_test", label: "IELTS / Duolingo / English Test", required: true },
    { id: "bank_statement", label: "Bank Solvency / Statement", required: true },
    { id: "sop", label: "Statement of Purpose (SOP)", required: false },
    { id: "photo", label: "Passport-size Photograph", required: false },
    { id: "cv", label: "CV / Resume", required: false }
  ];

  var APPLICATION_STAGES = [
    "Profile Submitted",
    "Document Verification",
    "University / Visa Filing",
    "Interview Stage",
    "Approved & Ready to Fly"
  ];

  var PLANS = {
    free: { id: "free", name: "Free Trial", days: 7, price: 0, tagline: "Explore the platform for 7 days" },
    premium: { id: "premium", name: "Premium", days: null, price: 4999, tagline: "Full consultancy access, currency BDT/month" }
  };

  var COMPANY_STATS_SEED = {
    foundedYear: 2016,
    studentsPlaced: "10,000+",
    visaSuccessRate: "98%",
    partnerUniversities: "450+",
    countriesServed: "12+"
  };

  var TEAM_SEED = [
    { id: "emp_1", name: "Md. Rafiqul Islam", designation: "Founder & Chief Executive Officer", department: "Leadership", since: 2016, isPartner: true, bio: "Rafiqul founded Edu Abroad in 2016 with a mission to make world-class education accessible to every Bangladeshi student.", photo: "images/Edu-Abroad-Logo.png", linkedin: "#", order: 1 },
    { id: "emp_2", name: "Nusrat Jahan", designation: "Managing Director & Co-Founder", department: "Leadership", since: 2016, isPartner: true, bio: "Nusrat leads strategy and university partnerships, having built relationships with 450+ institutions across 12 countries.", photo: "images/Edu-Abroad-Logo.png", linkedin: "#", order: 2 },
    { id: "emp_3", name: "Tanvir Ahmed", designation: "Head of Visa & Immigration", department: "Visa Services", since: 2018, isPartner: false, bio: "Tanvir oversees all visa filing operations with a 98% success rate across USA, UK, Canada, Australia and Europe.", photo: "images/Edu-Abroad-Logo.png", linkedin: "#", order: 3 },
    { id: "emp_4", name: "Sadia Rahman", designation: "Senior Education Counselor", department: "Counseling", since: 2019, isPartner: false, bio: "Sadia has guided over 1,200 students into top-ranked universities across the UK and Australia.", photo: "images/Edu-Abroad-Logo.png", linkedin: "#", order: 4 },
    { id: "emp_5", name: "Imran Kabir", designation: "Business Development Manager", department: "Partnerships", since: 2020, isPartner: false, bio: "Imran manages university and institutional partnerships, expanding our destination network year over year.", photo: "images/Edu-Abroad-Logo.png", linkedin: "#", order: 5 },
    { id: "emp_6", name: "Farzana Akter", designation: "Documentation & Compliance Officer", department: "Operations", since: 2021, isPartner: false, bio: "Farzana ensures every application meets the exact documentation standards required by embassies and universities.", photo: "images/Edu-Abroad-Logo.png", linkedin: "#", order: 6 }
  ];

  var PARTNERS_SEED = [
    { id: "ptn_1", name: "University of Toronto", country: "Canada", logo: "images/Edu-Abroad-Logo.png" },
    { id: "ptn_2", name: "University of Melbourne", country: "Australia", logo: "images/Edu-Abroad-Logo.png" },
    { id: "ptn_3", name: "University of Manchester", country: "UK", logo: "images/Edu-Abroad-Logo.png" },
    { id: "ptn_4", name: "Arizona State University", country: "USA", logo: "images/Edu-Abroad-Logo.png" },
    { id: "ptn_5", name: "University of Auckland", country: "New Zealand", logo: "images/Edu-Abroad-Logo.png" },
    { id: "ptn_6", name: "Humber College", country: "Canada", logo: "images/Edu-Abroad-Logo.png" }
  ];

  var UNIVERSITIES_SEED = [
    { id: "uni_1", name: "University of Toronto", country: "Canada", city: "Toronto", logo: "images/logo_Black.png", image: "images/canada_destination_1772687624868.png", minAge: 17, maxAge: 35, minIELTS: 6.5, minBudgetBDT: 1800000, tuitionLabel: "৳18,00,000 - ৳28,00,000 / year", qualification: "HSC/A-Level with minimum GPA 4.0 (or equivalent) for Undergraduate/Honors; a 4-year Bachelor's degree with minimum CGPA 3.0 for Masters programs; a Master's degree with a strong research proposal for PhD.", subjects: ["Computer Science", "Business Administration", "Engineering", "Data Science", "Architecture"], documents: ["passport", "academic", "english_test", "bank_statement", "sop", "photo", "cv"], ranking: "QS #21", popular: true, levels: ["Honors", "Masters", "PhD"] },
    { id: "uni_2", name: "University of British Columbia", country: "Canada", city: "Vancouver", logo: "images/logo_Black.png", image: "images/canada/canada_sec_1.jpg", minAge: 17, maxAge: 35, minIELTS: 6.5, minBudgetBDT: 1600000, tuitionLabel: "৳16,00,000 - ৳25,00,000 / year", qualification: "HSC/A-Level with minimum GPA 3.5 for Undergraduate/Honors; Bachelor's degree with minimum CGPA 2.8 for Masters programs.", subjects: ["Environmental Science", "Business", "Nursing", "Computer Engineering", "Media Studies"], documents: ["passport", "academic", "english_test", "bank_statement", "sop", "photo"], ranking: "QS #34", popular: true, levels: ["Honors", "Masters"] },
    { id: "uni_3", name: "University of Manchester", country: "UK", city: "Manchester", logo: "images/logo_Black.png", image: "images/uk_destination_1772687702581.png", minAge: 17, maxAge: 40, minIELTS: 6.0, minBudgetBDT: 1400000, tuitionLabel: "৳14,00,000 - ৳22,00,000 / year", qualification: "HSC/A-Level with minimum GPA 4.0 for Undergraduate/Honors; Bachelor's degree with minimum CGPA 2.75 for Masters programs; Master's degree with research proposal for PhD.", subjects: ["Mechanical Engineering", "Economics", "Law", "Pharmacy", "Business Analytics"], documents: ["passport", "academic", "english_test", "bank_statement", "sop", "cv"], ranking: "QS #32", popular: true, levels: ["Honors", "Masters", "PhD"] },
    { id: "uni_4", name: "University of Leeds", country: "UK", city: "Leeds", logo: "images/logo_Black.png", image: "images/uk/uk_sec_5.jpg", minAge: 17, maxAge: 40, minIELTS: 6.0, minBudgetBDT: 1200000, tuitionLabel: "৳12,00,000 - ৳19,00,000 / year", qualification: "HSC/A-Level with minimum GPA 3.5 for Undergraduate/Honors; Bachelor's degree with minimum CGPA 2.5 for Masters programs.", subjects: ["International Relations", "Civil Engineering", "Marketing", "Psychology", "Data Analytics"], documents: ["passport", "academic", "english_test", "bank_statement", "sop"], ranking: "QS #75", popular: false, levels: ["Honors", "Masters"] },
    { id: "uni_5", name: "Arizona State University", country: "USA", city: "Tempe, AZ", logo: "images/logo_Black.png", image: "images/usa_destination_1772687609887.png", minAge: 17, maxAge: 40, minIELTS: 6.0, minBudgetBDT: 1500000, tuitionLabel: "৳15,00,000 - ৳24,00,000 / year", qualification: "HSC/A-Level with minimum GPA 3.0 for Undergraduate/Honors; Bachelor's degree with minimum CGPA 2.5 for Masters (MS/MBA) programs; Master's degree for PhD applicants.", subjects: ["Computer Science", "Supply Chain Management", "Journalism", "Biomedical Engineering", "Finance"], documents: ["passport", "academic", "english_test", "bank_statement", "sop", "cv"], ranking: "US #121", popular: true, levels: ["Honors", "Masters", "PhD"] },
    { id: "uni_6", name: "University of Texas at Dallas", country: "USA", city: "Dallas, TX", logo: "images/logo_Black.png", image: "images/usa/usa_sec_2.jpg", minAge: 17, maxAge: 40, minIELTS: 6.0, minBudgetBDT: 1300000, tuitionLabel: "৳13,00,000 - ৳21,00,000 / year", qualification: "HSC/A-Level with minimum GPA 3.0 for Undergraduate/Honors; Bachelor's degree with minimum CGPA 2.75 for Masters programs.", subjects: ["Electrical Engineering", "Business Analytics", "Software Engineering", "Accounting", "Public Policy"], documents: ["passport", "academic", "english_test", "bank_statement", "sop"], ranking: "US #145", popular: false, levels: ["Honors", "Masters"] },
    { id: "uni_7", name: "University of Melbourne", country: "Australia", city: "Melbourne", logo: "images/logo_Black.png", image: "images/aus_destination_1772687687147.png", minAge: 17, maxAge: 40, minIELTS: 6.5, minBudgetBDT: 2000000, tuitionLabel: "৳20,00,000 - ৳30,00,000 / year", qualification: "HSC/A-Level with minimum GPA 4.0 for Undergraduate/Honors; Bachelor's degree with minimum CGPA 3.0 for Masters programs; Master's degree with research proposal for PhD.", subjects: ["Medicine", "Commerce", "Data Science", "Architecture", "Law"], documents: ["passport", "academic", "english_test", "bank_statement", "sop", "photo", "cv"], ranking: "QS #14", popular: true, levels: ["Honors", "Masters", "PhD"] },
    { id: "uni_8", name: "Deakin University", country: "Australia", city: "Melbourne", logo: "images/logo_Black.png", image: "images/australia/australia_sec_1.jpg", minAge: 17, maxAge: 40, minIELTS: 6.0, minBudgetBDT: 1300000, tuitionLabel: "৳13,00,000 - ৳20,00,000 / year", qualification: "HSC/A-Level with minimum GPA 2.5 for Undergraduate/Honors; Bachelor's degree with minimum CGPA 2.3 for Masters programs.", subjects: ["IT & Cybersecurity", "Criminology", "Nursing", "Sports Management", "Engineering"], documents: ["passport", "academic", "english_test", "bank_statement", "sop"], ranking: "QS #232", popular: false, levels: ["Honors", "Masters"] },
    { id: "uni_9", name: "University of Auckland", country: "New Zealand", city: "Auckland", logo: "images/logo_Black.png", image: "images/nz_destination_1772687718254.png", minAge: 17, maxAge: 40, minIELTS: 6.0, minBudgetBDT: 1400000, tuitionLabel: "৳14,00,000 - ৳22,00,000 / year", qualification: "HSC/A-Level with minimum GPA 3.0 for Undergraduate/Honors; Bachelor's degree with minimum CGPA 2.5 for Masters programs.", subjects: ["Engineering", "Hospitality Management", "Computer Science", "Health Science", "Education"], documents: ["passport", "academic", "english_test", "bank_statement", "sop", "photo"], ranking: "QS #68", popular: false, levels: ["Honors", "Masters"] },
    { id: "uni_10", name: "Humboldt University of Berlin", country: "Europe", city: "Berlin, Germany", logo: "images/logo_Black.png", image: "images/europe_destination_1772687670147.png", minAge: 17, maxAge: 40, minIELTS: 6.0, minBudgetBDT: 900000, tuitionLabel: "৳9,00,000 - ৳15,00,000 / year (low/no tuition)", qualification: "HSC/A-Level with minimum GPA 3.5 plus 1-year Foundation/Studienkolleg for Undergraduate/Honors; Bachelor's degree with minimum CGPA 2.75 for Masters programs; Master's degree with research proposal for PhD.", subjects: ["Mechanical Engineering", "Economics", "Social Sciences", "Computer Science", "Public Health"], documents: ["passport", "academic", "english_test", "bank_statement", "sop"], ranking: "QS #120", popular: true, levels: ["Honors", "Masters", "PhD"] },
    { id: "uni_11", name: "University of Warsaw", country: "Europe", city: "Warsaw, Poland", logo: "images/logo_Black.png", image: "images/europe_destination_1772687670147.png", minAge: 17, maxAge: 40, minIELTS: 5.5, minBudgetBDT: 700000, tuitionLabel: "৳7,00,000 - ৳12,00,000 / year", qualification: "HSC/A-Level with minimum GPA 3.0 for Undergraduate/Honors; Bachelor's degree with minimum CGPA 2.5 for Masters programs.", subjects: ["Business & Finance", "International Relations", "Computer Science", "Biotechnology", "Tourism"], documents: ["passport", "academic", "english_test", "bank_statement", "sop"], ranking: "QS #308", popular: false, levels: ["Honors", "Masters"] },
    { id: "uni_12", name: "Toronto Metropolitan University", country: "Canada", city: "Toronto", logo: "images/logo_Black.png", image: "images/canada/canada_sec_3.jpg", minAge: 17, maxAge: 40, minIELTS: 6.0, minBudgetBDT: 1300000, tuitionLabel: "৳13,00,000 - ৳20,00,000 / year", qualification: "HSC/A-Level with minimum GPA 3.0 for Undergraduate/Honors; Bachelor's degree with minimum CGPA 2.5 for Masters programs.", subjects: ["Journalism", "Fashion Design", "IT Management", "Urban Planning", "Business Technology Management"], documents: ["passport", "academic", "english_test", "bank_statement", "sop", "photo"], ranking: "QS #601-650", popular: false, levels: ["Honors", "Masters"] }
  ];

  var BLOG_SEED = [
    {
      id: "post_1", type: "article", title: "5 Steps to a Winning Statement of Purpose",
      excerpt: "Your SOP can make or break your application. Here's exactly how our counselors help students craft one that stands out.",
      content: "A strong Statement of Purpose tells the admissions committee who you are, why you've chosen this program, and where you're headed. Start with a genuine hook, connect your academic background to your goals, research the specific program you're applying to, be honest about challenges you've overcome, and always end with a clear vision of your future. Our counselors review every SOP line by line before submission.",
      coverImage: "images/hero_student_campus.png", videoUrl: "", author: "Sadia Rahman", category: "Applications",
      published: true, createdAt: nowISO(), views: 482
    },
    {
      id: "post_2", type: "video", title: "Student Visa Interview: What to Expect",
      excerpt: "Watch our Head of Visa & Immigration walk through common interview questions and how to answer them confidently.",
      content: "In this video, Tanvir Ahmed breaks down the most common student visa interview questions for the USA, UK, and Canada, plus body language and document-readiness tips.",
      coverImage: "images/hero_students_1772687595270.png", videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", author: "Tanvir Ahmed", category: "Visa Tips",
      published: true, createdAt: nowISO(), views: 915
    },
    {
      id: "post_3", type: "article", title: "Top Scholarships for Bangladeshi Students in 2026",
      excerpt: "A roundup of fully-funded and partial scholarships currently open for applications across our partner destinations.",
      content: "From Chevening to DAAD, Australia Awards to university-specific merit scholarships — we break down eligibility, deadlines, and how our team helps you apply with the strongest possible profile.",
      coverImage: "images/uk_destination_1772687702581.png", videoUrl: "", author: "Nusrat Jahan", category: "Scholarships",
      published: true, createdAt: nowISO(), views: 673
    }
  ];

  function uid(prefix) {
    return (prefix || "id") + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function nowISO() { return new Date().toISOString(); }

  function hash(str) {
    // NOT cryptographically secure — demo-only obfuscation for localStorage.
    var h = 0;
    for (var i = 0; i < str.length; i++) { h = (Math.imul(31, h) + str.charCodeAt(i)) | 0; }
    return "h" + h + "_" + btoa(unescape(encodeURIComponent(str))).slice(0, 12);
  }

  /* ---------------------------- DATA LAYER ---------------------------- */

  function readDB() {
    var raw = localStorage.getItem(DB_KEY);
    if (!raw) return seedDB();
    try {
      var db = JSON.parse(raw);
      if (!db.users || !db.users.length) return seedDB();
      return ensureCollections(db);
    } catch (e) {
      return seedDB();
    }
  }

  function writeDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  function blankDocuments() {
    return DOCUMENT_TYPES.map(function (t) {
      return { typeId: t.id, status: "not_uploaded", fileName: null, uploadedAt: null, note: "", sizeLabel: null };
    });
  }

  function seedDB() {
    var trialStart = new Date();
    var db = {
      users: [
        {
          id: uid("usr"),
          role: "admin",
          name: "Edu Abroad Admin",
          email: "admin@eduabroad.com",
          phone: "+880 1700-000000",
          passwordHash: hash("Admin@123"),
          plan: "premium",
          country: "N/A",
          destination: "N/A",
          createdAt: nowISO(),
          trialEndsAt: null,
          stageIndex: 0,
          documents: [],
          notifications: [],
          docCheckFreeUsed: false,
          docCheckCredits: 0
        },
        {
          id: uid("usr"),
          role: "client",
          name: "Opu Hasnat",
          email: "client@eduabroad.com",
          phone: "+880 1911-223344",
          passwordHash: hash("Client@123"),
          plan: "free",
          country: "Bangladesh",
          destination: "Canada",
          createdAt: nowISO(),
          trialEndsAt: new Date(trialStart.getTime() + PLANS.free.days * 86400000).toISOString(),
          stageIndex: 1,
          documents: blankDocuments().map(function (d, i) {
            if (i === 0) return Object.assign({}, d, { status: "verified", fileName: "passport_bio.pdf", uploadedAt: nowISO(), sizeLabel: "1.2 MB" });
            if (i === 1) return Object.assign({}, d, { status: "pending", fileName: "transcripts.pdf", uploadedAt: nowISO(), sizeLabel: "3.4 MB" });
            if (i === 2) return Object.assign({}, d, { status: "rejected", fileName: "ielts_result.jpg", uploadedAt: nowISO(), sizeLabel: "800 KB", note: "Image is blurry — please re-upload a clear scan." });
            return d;
          }),
          notifications: [
            { id: uid("ntf"), text: "Your IELTS result was rejected — please re-upload.", createdAt: nowISO(), read: false }
          ],
          docCheckFreeUsed: false,
          docCheckCredits: 0
        }
      ],
      appointments: [],
      activityLog: [],
      team: TEAM_SEED.slice(),
      partners: PARTNERS_SEED.slice(),
      blogPosts: BLOG_SEED.slice(),
      universities: UNIVERSITIES_SEED.slice(),
      contactMessages: [],
      companyStats: Object.assign({}, COMPANY_STATS_SEED)
    };
    writeDB(db);
    return db;
  }

  function ensureCollections(db) {
    if (!db.team) db.team = TEAM_SEED.slice();
    if (!db.partners) db.partners = PARTNERS_SEED.slice();
    if (!db.blogPosts) db.blogPosts = BLOG_SEED.slice();
    if (!db.universities || !db.universities.length) db.universities = UNIVERSITIES_SEED.slice();
    if (!db.contactMessages) db.contactMessages = [];
    if (!db.companyStats) db.companyStats = Object.assign({}, COMPANY_STATS_SEED);
    if (db.users) {
      db.users.forEach(function (u) {
        if (typeof u.docCheckFreeUsed === "undefined") u.docCheckFreeUsed = false;
        if (typeof u.docCheckCredits === "undefined") u.docCheckCredits = 0;
      });
    }
    return db;
  }

  function saveUser(user) {
    var db = readDB();
    var idx = db.users.findIndex(function (u) { return u.id === user.id; });
    if (idx > -1) db.users[idx] = user;
    writeDB(db);
  }

  function log(db, text) {
    db.activityLog.unshift({ id: uid("log"), text: text, at: nowISO() });
    db.activityLog = db.activityLog.slice(0, 200);
  }

  /* ------------------------------ SESSION ------------------------------ */

  function setSession(userId) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: userId, at: nowISO() }));
  }
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }
  function getSession() {
    var raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  /* ------------------------------- AUTH API ----------------------------- */

  var PROGRAM_LEVELS = ["Honors", "Masters", "PhD"];

  var EduAuth = {
    DOCUMENT_TYPES: DOCUMENT_TYPES,
    APPLICATION_STAGES: APPLICATION_STAGES,
    PLANS: PLANS,
    PROGRAM_LEVELS: PROGRAM_LEVELS,

    register: function (payload) {
      var db = readDB();
      var email = (payload.email || "").trim().toLowerCase();
      if (!email || !payload.password || !payload.name) {
        return { ok: false, error: "Please fill in all required fields." };
      }
      if (payload.password.length < 6) {
        return { ok: false, error: "Password must be at least 6 characters." };
      }
      var exists = db.users.some(function (u) { return u.email.toLowerCase() === email; });
      if (exists) {
        return { ok: false, error: "An account with this email already exists. Please log in instead." };
      }
      var plan = payload.plan === "premium" ? "premium" : "free";
      var user = {
        id: uid("usr"),
        role: "client",
        name: payload.name.trim(),
        email: email,
        phone: payload.phone || "",
        passwordHash: hash(payload.password),
        plan: plan,
        country: payload.country || "Bangladesh",
        destination: payload.destination || "Not decided yet",
        createdAt: nowISO(),
        trialEndsAt: plan === "free" ? new Date(Date.now() + PLANS.free.days * 86400000).toISOString() : null,
        stageIndex: 0,
        documents: blankDocuments(),
        notifications: [
          { id: uid("ntf"), text: "Welcome to Edu Abroad! Please upload your documents to begin verification.", createdAt: nowISO(), read: false }
        ],
        docCheckFreeUsed: false,
        docCheckCredits: 0
      };
      db.users.push(user);
      log(db, "New signup: " + user.name + " (" + user.email + ") on " + plan + " plan.");
      writeDB(db);
      setSession(user.id);
      return { ok: true, user: user };
    },

    login: function (email, password) {
      var db = readDB();
      email = (email || "").trim().toLowerCase();
      var user = db.users.find(function (u) { return u.email.toLowerCase() === email; });
      if (!user || user.passwordHash !== hash(password || "")) {
        return { ok: false, error: "Incorrect email or password." };
      }
      setSession(user.id);
      log(db, user.name + " logged in.");
      writeDB(db);
      return { ok: true, user: user };
    },

    logout: function () {
      clearSession();
    },

    currentUser: function () {
      var session = getSession();
      if (!session) return null;
      var db = readDB();
      return db.users.find(function (u) { return u.id === session.userId; }) || null;
    },

    requireRole: function (role, redirectTo) {
      var user = EduAuth.currentUser();
      if (!user || (role && user.role !== role)) {
        window.location.href = redirectTo || "login.html";
        return null;
      }
      return user;
    },

    updateProfile: function (userId, patch) {
      var db = readDB();
      var user = db.users.find(function (u) { return u.id === userId; });
      if (!user) return { ok: false };
      Object.assign(user, patch);
      writeDB(db);
      return { ok: true, user: user };
    },

    upgradePlan: function (userId, planId) {
      var db = readDB();
      var user = db.users.find(function (u) { return u.id === userId; });
      if (!user) return { ok: false };
      user.plan = planId;
      user.trialEndsAt = planId === "free" ? new Date(Date.now() + PLANS.free.days * 86400000).toISOString() : null;
      user.notifications.unshift({ id: uid("ntf"), text: "Your plan was updated to " + PLANS[planId].name + ".", createdAt: nowISO(), read: false });
      log(db, user.name + " changed plan to " + planId + ".");
      writeDB(db);
      return { ok: true, user: user };
    },

    uploadDocument: function (userId, typeId, fileName, sizeLabel) {
      var db = readDB();
      var user = db.users.find(function (u) { return u.id === userId; });
      if (!user) return { ok: false };
      var doc = user.documents.find(function (d) { return d.typeId === typeId; });
      if (!doc) return { ok: false };
      doc.status = "pending";
      doc.fileName = fileName;
      doc.sizeLabel = sizeLabel || null;
      doc.uploadedAt = nowISO();
      doc.note = "";
      log(db, user.name + " uploaded " + typeId + " (" + fileName + ").");
      writeDB(db);
      return { ok: true, user: user };
    },

    reviewDocument: function (userId, typeId, decision, note) {
      var db = readDB();
      var user = db.users.find(function (u) { return u.id === userId; });
      if (!user) return { ok: false };
      var doc = user.documents.find(function (d) { return d.typeId === typeId; });
      if (!doc) return { ok: false };
      doc.status = decision; // 'verified' | 'rejected'
      doc.note = note || "";
      user.notifications.unshift({
        id: uid("ntf"),
        text: decision === "verified"
          ? "Your document \"" + typeId + "\" has been verified."
          : "Your document \"" + typeId + "\" was rejected: " + (note || "Please re-upload."),
        createdAt: nowISO(),
        read: false
      });
      log(db, "Admin marked " + typeId + " for " + user.name + " as " + decision + ".");
      writeDB(db);
      return { ok: true, user: user };
    },

    setStage: function (userId, stageIndex) {
      var db = readDB();
      var user = db.users.find(function (u) { return u.id === userId; });
      if (!user) return { ok: false };
      user.stageIndex = stageIndex;
      log(db, "Admin moved " + user.name + " to stage: " + APPLICATION_STAGES[stageIndex]);
      writeDB(db);
      return { ok: true, user: user };
    },

    allClients: function () {
      return readDB().users.filter(function (u) { return u.role === "client"; });
    },

    activityLog: function () {
      return readDB().activityLog;
    },

    bookAppointment: function (payload) {
      var db = readDB();
      var appt = Object.assign({ id: uid("apt"), createdAt: nowISO(), status: "new" }, payload);
      db.appointments.unshift(appt);
      log(db, "New appointment request from " + (payload.name || "guest") + ".");
      writeDB(db);
      return appt;
    },

    allAppointments: function () {
      return readDB().appointments;
    },

    trialDaysLeft: function (user) {
      if (!user || user.plan !== "free" || !user.trialEndsAt) return null;
      var diff = new Date(user.trialEndsAt).getTime() - Date.now();
      return Math.max(0, Math.ceil(diff / 86400000));
    },

    resetDemoData: function () {
      localStorage.removeItem(DB_KEY);
      localStorage.removeItem(SESSION_KEY);
      readDB();
    },

    /* ------------------------------ ALL USERS / STATS ------------------------------ */

    allUsers: function () {
      return readDB().users;
    },

    deleteUser: function (userId) {
      var db = readDB();
      var user = db.users.find(function (u) { return u.id === userId; });
      if (!user) return { ok: false };
      db.users = db.users.filter(function (u) { return u.id !== userId; });
      log(db, "Admin deleted user: " + user.name + " (" + user.email + ").");
      writeDB(db);
      return { ok: true };
    },

    dailyStats: function (days) {
      days = days || 14;
      var db = readDB();
      var buckets = [];
      var map = {};
      for (var i = days - 1; i >= 0; i--) {
        var d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        var key = d.toISOString().slice(0, 10);
        var bucket = { date: key, label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), newUsers: 0, revenue: 0 };
        buckets.push(bucket);
        map[key] = bucket;
      }
      db.users.forEach(function (u) {
        var key = (u.createdAt || '').slice(0, 10);
        if (map[key]) {
          map[key].newUsers += 1;
          if (u.plan === 'premium') map[key].revenue += PLANS.premium.price;
        }
      });
      return buckets;
    },

    totalRevenue: function () {
      var db = readDB();
      var premiumCount = db.users.filter(function (u) { return u.plan === 'premium'; }).length;
      return premiumCount * PLANS.premium.price;
    },

    /* ------------------------------ COMPANY PROFILE ------------------------------ */

    companyStats: function () {
      return readDB().companyStats;
    },
    updateCompanyStats: function (patch) {
      var db = readDB();
      Object.assign(db.companyStats, patch);
      writeDB(db);
      return { ok: true, stats: db.companyStats };
    },

    /* ---------------------------------- TEAM ---------------------------------- */

    allTeam: function () {
      return readDB().team.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    },
    getTeamMember: function (id) {
      return readDB().team.find(function (t) { return t.id === id; }) || null;
    },
    addTeamMember: function (payload) {
      var db = readDB();
      var member = Object.assign({
        id: uid("emp"), name: "", designation: "", department: "", since: new Date().getFullYear(),
        isPartner: false, bio: "", photo: "images/Edu-Abroad-Logo.png", linkedin: "#", order: db.team.length + 1
      }, payload);
      db.team.push(member);
      log(db, "Admin added team member: " + member.name + ".");
      writeDB(db);
      return { ok: true, member: member };
    },
    updateTeamMember: function (id, patch) {
      var db = readDB();
      var member = db.team.find(function (t) { return t.id === id; });
      if (!member) return { ok: false };
      Object.assign(member, patch);
      log(db, "Admin updated team member: " + member.name + ".");
      writeDB(db);
      return { ok: true, member: member };
    },
    deleteTeamMember: function (id) {
      var db = readDB();
      db.team = db.team.filter(function (t) { return t.id !== id; });
      writeDB(db);
      return { ok: true };
    },

    /* --------------------------------- PARTNERS -------------------------------- */

    allPartners: function () {
      return readDB().partners;
    },
    addPartner: function (payload) {
      var db = readDB();
      var partner = Object.assign({ id: uid("ptn"), name: "", country: "", logo: "images/Edu-Abroad-Logo.png" }, payload);
      db.partners.push(partner);
      writeDB(db);
      return { ok: true, partner: partner };
    },
    deletePartner: function (id) {
      var db = readDB();
      db.partners = db.partners.filter(function (p) { return p.id !== id; });
      writeDB(db);
      return { ok: true };
    },

    /* ----------------------------------- BLOG ----------------------------------- */

    allBlogPosts: function (publishedOnly) {
      var posts = readDB().blogPosts.slice().sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
      if (publishedOnly) posts = posts.filter(function (p) { return p.published; });
      return posts;
    },
    getBlogPost: function (id) {
      return readDB().blogPosts.find(function (p) { return p.id === id; }) || null;
    },
    addBlogPost: function (payload) {
      var db = readDB();
      var post = Object.assign({
        id: uid("post"), type: "article", title: "", excerpt: "", content: "", coverImage: "images/hero_student_campus.png",
        videoUrl: "", author: "Edu Abroad Team", category: "General", published: true, createdAt: nowISO(), views: 0
      }, payload);
      db.blogPosts.unshift(post);
      log(db, "Admin published a new " + post.type + ": \"" + post.title + "\".");
      writeDB(db);
      return { ok: true, post: post };
    },
    updateBlogPost: function (id, patch) {
      var db = readDB();
      var post = db.blogPosts.find(function (p) { return p.id === id; });
      if (!post) return { ok: false };
      Object.assign(post, patch);
      log(db, "Admin updated post: \"" + post.title + "\".");
      writeDB(db);
      return { ok: true, post: post };
    },
    deleteBlogPost: function (id) {
      var db = readDB();
      db.blogPosts = db.blogPosts.filter(function (p) { return p.id !== id; });
      writeDB(db);
      return { ok: true };
    },
    incrementBlogViews: function (id) {
      var db = readDB();
      var post = db.blogPosts.find(function (p) { return p.id === id; });
      if (post) { post.views = (post.views || 0) + 1; writeDB(db); }
    },

    /* ------------------------------ UNIVERSITIES / ELIGIBILITY ------------------------------ */

    DOCUMENT_TYPES_MAP: (function () {
      var m = {};
      DOCUMENT_TYPES.forEach(function (t) { m[t.id] = t.label; });
      return m;
    })(),

    allUniversities: function () {
      var db = readDB();
      return db.universities.slice();
    },
    getUniversity: function (id) {
      var db = readDB();
      return db.universities.find(function (u) { return u.id === id; }) || null;
    },
    addUniversity: function (payload) {
      var db = readDB();
      var uni = Object.assign({
        id: uid("uni"),
        name: "", country: "", city: "", logo: "images/logo_Black.png",
        image: "images/Edu-Abroad-Logo.png",
        minAge: 17, maxAge: 40, minIELTS: 6.0, minBudgetBDT: 0,
        tuitionLabel: "", qualification: "", subjects: [], documents: [], ranking: "", popular: false, levels: []
      }, payload);
      db.universities.push(uni);
      log(db, "Admin added a new university: \"" + uni.name + "\".");
      writeDB(db);
      return { ok: true, university: uni };
    },
    updateUniversity: function (id, patch) {
      var db = readDB();
      var uni = db.universities.find(function (u) { return u.id === id; });
      if (!uni) return { ok: false, error: "University not found." };
      Object.assign(uni, patch);
      log(db, "Admin updated university: \"" + uni.name + "\".");
      writeDB(db);
      return { ok: true, university: uni };
    },
    deleteUniversity: function (id) {
      var db = readDB();
      var uni = db.universities.find(function (u) { return u.id === id; });
      db.universities = db.universities.filter(function (u) { return u.id !== id; });
      if (uni) log(db, "Admin removed university: \"" + uni.name + "\".");
      writeDB(db);
      return { ok: true };
    },
    // Returns eligible universities sorted by best-fit (closest IELTS/budget match first).
    matchUniversities: function (filters) {
      filters = filters || {};
      var age = filters.age != null ? Number(filters.age) : null;
      var ielts = filters.ielts != null ? Number(filters.ielts) : null;
      var budget = filters.budget != null ? Number(filters.budget) : null;
      var country = filters.country || "";
      var level = filters.level || "";
      var subject = (filters.subject || "").trim().toLowerCase();
      var db = readDB();
      var list = db.universities.filter(function (u) {
        if (age != null && !isNaN(age) && (age < u.minAge || age > u.maxAge)) return false;
        if (ielts != null && !isNaN(ielts) && ielts < u.minIELTS) return false;
        if (budget != null && !isNaN(budget) && budget < u.minBudgetBDT) return false;
        if (country && u.country !== country) return false;
        if (level && (u.levels || []).indexOf(level) === -1) return false;
        if (subject) {
          var hasSubject = (u.subjects || []).some(function (s) { return s.toLowerCase().indexOf(subject) > -1; });
          if (!hasSubject) return false;
        }
        return true;
      });
      list.sort(function (a, b) {
        if (a.popular !== b.popular) return a.popular ? -1 : 1;
        return a.minIELTS - b.minIELTS;
      });
      return list;
    },
    // All distinct subjects/programs across every partner university — used to
    // power the "Field of Study" search/autocomplete on the Eligibility Checker.
    allSubjects: function () {
      var db = readDB();
      var set = {};
      db.universities.forEach(function (u) {
        (u.subjects || []).forEach(function (s) { set[s] = true; });
      });
      return Object.keys(set).sort();
    },

    /* ---------------------------- DOCUMENT CHECK (PAYWALL) ---------------------------- */
    // Access rules:
    //  - admin role: always unlimited, free.
    //  - premium plan: always unlimited, free.
    //  - free plan: 1 free check ever, then ৳100 unlocks a bundle of 4 more checks.
    //  - Viewing a completed result/report is ALWAYS free — payment is only
    //    required to run a brand-new cross-check, never to see past results.
    DOC_CHECK_PRICE_BDT: 100,
    DOC_CHECK_BUNDLE_SIZE: 4,

    docCheckStatus: function (userId) {
      var db = readDB();
      var u = db.users.find(function (x) { return x.id === userId; });
      if (!u) return { ok: false };
      var unlimited = u.role === "admin" || u.plan === "premium";
      return {
        ok: true,
        unlimited: unlimited,
        freeAvailable: !unlimited && !u.docCheckFreeUsed,
        credits: u.docCheckCredits || 0,
        canRun: unlimited || !u.docCheckFreeUsed || (u.docCheckCredits || 0) > 0,
        price: this.DOC_CHECK_PRICE_BDT
      };
    },
    // Call this right before running a cross-check. Consumes the free check or one paid
    // credit. Returns { ok:false, needPayment:true } if nothing is left to consume.
    consumeDocCheck: function (userId) {
      var db = readDB();
      var u = db.users.find(function (x) { return x.id === userId; });
      if (!u) return { ok: false, error: "User not found." };
      var unlimited = u.role === "admin" || u.plan === "premium";
      if (unlimited) {
        return { ok: true, unlimited: true };
      }
      if (!u.docCheckFreeUsed) {
        u.docCheckFreeUsed = true;
        log(db, u.name + " used their free document check.");
        writeDB(db);
        return { ok: true, usedFree: true };
      }
      if ((u.docCheckCredits || 0) > 0) {
        u.docCheckCredits -= 1;
        log(db, u.name + " used a paid document check credit.");
        writeDB(db);
        return { ok: true, usedCredit: true, remainingCredits: u.docCheckCredits };
      }
      return { ok: false, needPayment: true, price: this.DOC_CHECK_PRICE_BDT };
    },
    // Simulated ৳100 payment (bKash/Nagad style) that unlocks a bundle of 4 more checks.
    payForDocCheck: function (userId) {
      var db = readDB();
      var u = db.users.find(function (x) { return x.id === userId; });
      if (!u) return { ok: false, error: "User not found." };
      u.docCheckCredits = (u.docCheckCredits || 0) + this.DOC_CHECK_BUNDLE_SIZE;
      log(db, u.name + " paid ৳" + this.DOC_CHECK_PRICE_BDT + " to unlock " + this.DOC_CHECK_BUNDLE_SIZE + " more document checks.");
      writeDB(db);
      return { ok: true, credits: u.docCheckCredits, added: this.DOC_CHECK_BUNDLE_SIZE };
    },

    /* ---------------------- DOCUMENT CHECK RESULT HISTORY (PORTAL CARDS) ---------------------- */
    // Every completed cross-check is logged here (see document-check.html) so it can be
    // shown as a card inside the client portal. Each entry starts locked; paying the
    // ৳100 report fee (or already being Premium/Admin) unlocks the full breakdown.
    docCheckHistory: function (userId) {
      try {
        var list = JSON.parse(localStorage.getItem("verifyHistory_" + userId) || "[]");
        // Viewing past results is always free — never gate a report behind payment.
        return list.map(function (item) { item.unlocked = true; return item; });
      } catch (e) {
        return [];
      }
    },
    saveDocCheckHistory: function (userId, list) {
      try {
        localStorage.setItem("verifyHistory_" + userId, JSON.stringify(list));
        return true;
      } catch (e) {
        return false;
      }
    },
    // Marks one result as unlocked (called after a successful bKash/Nagad payment confirmation).
    unlockDocCheckResult: function (userId, resultId) {
      var list = this.docCheckHistory(userId);
      var found = false;
      list = list.map(function (item) {
        if (item.id === resultId) { found = true; item.unlocked = true; }
        return item;
      });
      if (found) {
        this.saveDocCheckHistory(userId, list);
        var db = readDB();
        var u = db.users.find(function (x) { return x.id === userId; });
        if (u) log(db, u.name + " paid ৳" + this.DOC_CHECK_PRICE_BDT + " to unlock a document check report.");
        writeDB(db);
      }
      return { ok: found };
    },

    /* --------------------------------- CONTACT ---------------------------------- */

    submitContactMessage: function (payload) {
      var db = readDB();
      var msg = Object.assign({ id: uid("msg"), createdAt: nowISO(), status: "new" }, payload);
      db.contactMessages.unshift(msg);
      log(db, "New contact message from " + (payload.name || "guest") + ".");
      writeDB(db);
      return { ok: true, message: msg };
    },
    allContactMessages: function () {
      return readDB().contactMessages;
    }
  };

  window.EduAuth = EduAuth;

  /* =========================================================================
   * EduPayment — a shared bKash / Nagad "Send Money" checkout modal.
   * -------------------------------------------------------------------------
   * There is no real payment gateway wired up here (this whole site runs
   * without a backend — see the file header). What this DOES do for real:
   * it dials the official bKash (*247#) / Nagad (*167#) USSD "Send Money"
   * menu on the customer's own phone via a tel: link, and shows the exact
   * number + amount to enter, with a one-tap copy button. That is the one
   * payment flow that genuinely works from a static website with no server.
   *
   * >>> IMPORTANT: set your real personal/merchant bKash & Nagad number
   *     below before going live. <<<
   * ========================================================================= */
  var EduPayment = {
    NUMBER: "01700-000000",       // TODO: replace with your real bKash / Nagad number
    NUMBER_RAW: "01700000000",    // same number, digits only (used for copy + tel links)
    AMOUNT: 100,

    _injectStyles: function () {
      if (document.getElementById("edu-payment-styles")) return;
      var style = document.createElement("style");
      style.id = "edu-payment-styles";
      style.textContent =
        "#edu-pay-overlay{position:fixed;inset:0;background:rgba(15,15,20,.6);z-index:9998;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;pointer-events:none;transition:opacity .3s ease;}" +
        "#edu-pay-overlay.active{opacity:1;pointer-events:auto;}" +
        "#edu-pay-modal{background:#fff;width:100%;max-width:440px;border-radius:24px;box-shadow:0 30px 80px rgba(0,0,0,.35);transform:translateY(16px) scale(.97);opacity:0;transition:transform .35s cubic-bezier(.16,1,.3,1),opacity .35s ease;max-height:90vh;overflow-y:auto;}" +
        "#edu-pay-overlay.active #edu-pay-modal{transform:translateY(0) scale(1);opacity:1;}" +
        ".edu-pay-head{padding:22px 24px 16px;border-bottom:1px solid #f1f1f1;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}" +
        ".edu-pay-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:700;color:#1b3168;margin:0 0 4px;}" +
        ".edu-pay-sub{font-size:13px;color:#6b7280;margin:0;}" +
        ".edu-pay-close{background:#f3f4f6;border:none;width:32px;height:32px;border-radius:999px;cursor:pointer;color:#6b7280;flex-shrink:0;font-size:16px;line-height:1;}" +
        ".edu-pay-close:hover{background:#e5e7eb;color:#111827;}" +
        ".edu-pay-body{padding:20px 24px 24px;}" +
        ".edu-pay-amount{text-align:center;background:linear-gradient(135deg,#1b3168,#00a2e8);color:#fff;border-radius:16px;padding:18px;margin-bottom:18px;}" +
        ".edu-pay-amount .lbl{font-size:11px;text-transform:uppercase;letter-spacing:.12em;opacity:.85;font-weight:700;}" +
        ".edu-pay-amount .amt{font-family:'Cormorant Garamond',Georgia,serif;font-size:38px;font-weight:700;line-height:1.2;}" +
        ".edu-pay-methods{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;}" +
        ".edu-pay-method{border:2px solid #eef0f4;border-radius:14px;padding:14px 10px;text-align:center;cursor:pointer;background:#fff;transition:border-color .2s ease,background .2s ease;font-weight:700;font-size:14px;}" +
        ".edu-pay-method.bkash{color:#e2136e;}" +
        ".edu-pay-method.nagad{color:#f6921e;}" +
        ".edu-pay-method:hover, .edu-pay-method.active{border-color:currentColor;background:#fafafa;}" +
        ".edu-pay-steps{background:#f8fafc;border:1px solid #eef0f4;border-radius:14px;padding:14px 16px;font-size:13px;color:#374151;line-height:1.9;margin-bottom:16px;}" +
        ".edu-pay-steps b{color:#111827;}" +
        ".edu-pay-number-row{display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:8px 10px;margin:8px 0;}" +
        ".edu-pay-number-row span{font-weight:700;font-family:monospace;font-size:15px;color:#111827;letter-spacing:.03em;}" +
        ".edu-pay-copy{margin-left:auto;background:#1b3168;color:#fff;border:none;border-radius:8px;padding:6px 12px;font-size:11.5px;font-weight:700;cursor:pointer;}" +
        ".edu-pay-copy:hover{background:#00a2e8;}" +
        ".edu-pay-dial{display:block;text-align:center;background:#1b3168;color:#fff;text-decoration:none;padding:13px;border-radius:12px;font-weight:700;font-size:14.5px;margin-bottom:10px;}" +
        ".edu-pay-dial:hover{background:#152654;}" +
        ".edu-pay-confirm{display:block;width:100%;text-align:center;background:#16a34a;color:#fff;border:none;padding:13px;border-radius:12px;font-weight:700;font-size:14.5px;cursor:pointer;}" +
        ".edu-pay-confirm:hover{background:#15803d;}" +
        ".edu-pay-note{font-size:11.5px;color:#9ca3af;text-align:center;margin-top:10px;}";
      document.head.appendChild(style);
    },

    open: function (opts) {
      opts = opts || {};
      var self = this;
      this._injectStyles();

      var existing = document.getElementById("edu-pay-overlay");
      if (existing) existing.remove();

      var overlay = document.createElement("div");
      overlay.id = "edu-pay-overlay";
      var amount = opts.amount || this.AMOUNT;
      var title = opts.title || "Unlock with bKash / Nagad";
      var subtitle = opts.subtitle || "One-time payment, unlocked instantly on this device.";

      overlay.innerHTML =
        '<div id="edu-pay-modal">' +
          '<div class="edu-pay-head">' +
            '<div><p class="edu-pay-title">' + title + '</p><p class="edu-pay-sub">' + subtitle + '</p></div>' +
            '<button type="button" class="edu-pay-close" aria-label="Close">&times;</button>' +
          '</div>' +
          '<div class="edu-pay-body">' +
            '<div class="edu-pay-amount"><div class="lbl">Amount to pay</div><div class="amt">\u09F3' + amount + '</div></div>' +
            '<div class="edu-pay-methods">' +
              '<div class="edu-pay-method bkash active" data-method="bkash"><i class="fa-solid fa-mobile-screen-button"></i> bKash</div>' +
              '<div class="edu-pay-method nagad" data-method="nagad"><i class="fa-solid fa-mobile-screen-button"></i> Nagad</div>' +
            '</div>' +
            '<div class="edu-pay-steps">' +
              '1. Tap <b>"Dial to Send Money"</b> below (opens your phone\u2019s dialer)<br>' +
              '2. On the menu, choose <b>Send Money</b><br>' +
              '3. Enter this number:' +
              '<div class="edu-pay-number-row"><span id="edu-pay-number">' + self.NUMBER + '</span><button type="button" class="edu-pay-copy" id="edu-pay-copy-btn">Copy</button></div>' +
              '4. Enter amount <b>\u09F3' + amount + '</b>, then confirm with your <b>PIN</b>.' +
            '</div>' +
            '<a href="tel:*247%23" id="edu-pay-dial" class="edu-pay-dial"><i class="fa-solid fa-phone"></i> Dial to Send Money (bKash *247#)</a>' +
            '<button type="button" class="edu-pay-confirm" id="edu-pay-confirm-btn">\u2705 I\u2019ve Sent the Payment \u2014 Unlock Now</button>' +
            '<p class="edu-pay-note">Payments are verified manually by our team; unlocking here marks it as paid on this device.</p>' +
          '</div>' +
        '</div>';

      document.body.appendChild(overlay);
      requestAnimationFrame(function () { overlay.classList.add("active"); });
      document.body.style.overflow = "hidden";

      function close() {
        overlay.classList.remove("active");
        document.body.style.overflow = "";
        setTimeout(function () { overlay.remove(); }, 300);
      }

      overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
      overlay.querySelector(".edu-pay-close").addEventListener("click", close);

      var dialLink = overlay.querySelector("#edu-pay-dial");
      var methods = overlay.querySelectorAll(".edu-pay-method");
      methods.forEach(function (m) {
        m.addEventListener("click", function () {
          methods.forEach(function (x) { x.classList.remove("active"); });
          m.classList.add("active");
          if (m.dataset.method === "nagad") {
            dialLink.setAttribute("href", "tel:*167%23");
            dialLink.innerHTML = '<i class="fa-solid fa-phone"></i> Dial to Send Money (Nagad *167#)';
          } else {
            dialLink.setAttribute("href", "tel:*247%23");
            dialLink.innerHTML = '<i class="fa-solid fa-phone"></i> Dial to Send Money (bKash *247#)';
          }
        });
      });

      overlay.querySelector("#edu-pay-copy-btn").addEventListener("click", function () {
        var btn = this;
        var text = self.NUMBER_RAW;
        var done = function () { btn.textContent = "Copied!"; setTimeout(function () { btn.textContent = "Copy"; }, 1500); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(done);
        } else { done(); }
      });

      overlay.querySelector("#edu-pay-confirm-btn").addEventListener("click", function () {
        close();
        if (typeof opts.onConfirm === "function") opts.onConfirm();
      });
    }
  };

  window.EduPayment = EduPayment;
})(window);
