'use client'

import { useState, useEffect, useRef, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import './landing.css'
import { login, signupSubscriber, signupTrainer } from '@/lib/auth/actions'

// ── Translation object ──────────────────────────────────────────────
const T = {
  en: {
    navHow: 'How it works', navTrainers: 'Trainers', navPricing: 'Pricing', navJoin: 'For Trainers',
    navLogin: 'Login', navCta: 'Get Started',
    heroBadge: '186 Verified Trainers',
    heroH1a: 'Train with the ', heroH1em: 'best coaches', heroH1b: ' in the world.',
    heroSub: 'Connect with certified fitness coaches. Get a personalized workout and nutrition plan. Track your progress. All in one platform.',
    heroBtn1: 'Find your coach', heroBtn2: 'Are you a trainer? →',
    ht1: 'Subscribers', ht2: 'Certified trainers', ht3: 'Avg. rating',
    hcName: 'Khalid Sultan', hcSpec: 'Bodybuilding · Muscle Gain', hcClients: '847 clients · 🇸🇦 Saudi Arabia',
    hcPrice: 'from AED 299 / 32 days', hcProgress: '78% of slots filled',
    hf1Lbl: 'Week 3 Progress', hf1Sub: 'since you started 🔥', hf1Days: 'Day 22 of 32',
    hf2Lbl: "Today's Workout", hf2Ex1: 'Bench Press · 4×10', hf2Ex2: 'Incline DB · 3×12', hf2Ex3: 'Cable Flyes · 3×15',
    hf3Lbl: 'New message', hf3Msg: 'Great work today! Increase bench to 85kg next week 💪',
    stat1: 'Certified trainers', stat2: 'Subscribers', stat4: 'Average platform rating',
    audLabel: 'Who is FITLEEX for?', audTitle: "Let's change your Lifestyle",
    audSubBadge: 'For Subscribers', audSubTitle: "Reach your fitness goals with a coach who's committed to you.",
    audSubDesc: 'Stop following random workout videos. Get a personalized plan from a verified coach and track your real progress week by week.',
    asf1: 'Verified coaches only', asf2: 'Custom workout & nutrition plans', asf3: 'Direct chat with your coach',
    asf4: 'Weekly progress tracking', asf5: 'Pay with Tabby or Tamara — split 4 payments',
    audSubBtn: 'Find my coach →',
    audTrBadge: 'For Trainers', audTrTitle: 'Build your coaching business. We handle the rest.',
    audTrDesc: 'Focus on coaching. We handle payments, scheduling, and client management. Earn 80% of every subscription — no hidden fees.',
    atf1: 'Automatic subscription management', atf2: 'Manage subscriber plans — workout & nutrition',
    atf3: 'Manage everything from your Phone App', atf4: 'Instructional videos for every exercise',
    atf5: 'Manage subscribers from anywhere in the world',
    audTrBtn: 'Join as a trainer →',
    hiwLabel: 'The process', hiwTitle: 'Start in 4 simple steps',
    hiwSub: 'From signing up to your first workout in minutes — not days.',
    step1T: 'Browse coaches', step1D: 'Filter by specialty, country, price, and rating. Read reviews from real subscribers.',
    step2T: 'Subscribe', step2D: 'Choose a plan and pay securely. Split into 4 payments with Tabby or Tamara.',
    step3T: 'Get your plan', step3D: 'Your coach builds a personalized workout and nutrition plan just for you.',
    step4T: 'Train & track', step4D: 'Follow your plan, log weekly progress, chat with your coach, and see real results.',
    trLabel: 'Our coaches', trTitle: 'Meet verified trainers',
    trSub: 'Every trainer is verified with ID, credentials, and social proof. No shortcuts.',
    tc1Spec: 'Bodybuilding · Muscle Gain', tc1Cl: 'Clients', tc1Co: 'Saudi',
    tc2Spec: 'Nutrition · Weight Loss', tc2Cl: 'Clients', tc2Co: 'UAE',
    tc3Spec: "Women's Fitness · Pilates", tc3Cl: 'Clients', tc3Co: 'Lebanon',
    viewAll: 'View all 186 trainers →',
    payLabel: 'Flexible payments', payTitle: 'Pay your way — even split into 4',
    paySub: 'We accept all major payment methods. Use Tabby or Tamara to split your subscription into 4 interest-free installments.',
    pm1Name: 'Credit / Debit Card', pm1Desc: 'Visa, Mastercard, mada, Apple Pay',
    pm3Desc: 'Buy now, pay later', pm3Bnpl: '4 payments · 0% interest',
    pm4Desc: 'Split purchases easily', pm4Bnpl: '3 payments · 0% interest',
    payHowLbl: 'How it works',
    pstep1: 'Browse trainers and choose your coach',
    pstep2: 'Create a free account in 30 seconds',
    pstep3: 'Subscribe and choose your payment method',
    payAcceptedLbl: 'Accepted payments',
    tabbyLabel: '4 payments · 0% interest', tamaraLabel: '3 payments · 0% interest',
    payGetStarted: 'Get started',
    paySecurity: 'Secured by 256-bit SSL encryption',
    revLabel: 'What subscribers say', revTitle: 'Subscriber Results',
    rv1: '"Coach Khalid completely changed my approach to training. In 64 days I gained 4kg of muscle and lost 2kg of fat. The weekly check-ins kept me accountable."',
    rv1Meta: 'Muscle Builder · 64 days · 🇸🇦',
    rv2: '"The nutrition plan from Nour was something else — detailed, practical, and tailored to my lifestyle. Lost 8kg in my first two subscriptions!"',
    rv2Meta: 'Weight Loss · 32 days · 🇦🇪',
    rv3: '"Used Tabby to split the payment — made it so easy. The plan was ready within hours of subscribing. My coach responds to every message same day."',
    rv3Meta: 'Muscle Builder · 64 days · 🇰🇼',
    tctaBadge: 'For fitness professionals', tctaTitle: 'Join as a trainer.\nBuild your business.',
    tctaSub: 'Set up your profile, build plans, and start accepting subscribers. We handle payments, technology, and growth — you focus on coaching.',
    tctaBtn1: 'Apply as a trainer →', tctaBtn2: 'Learn more',
    footerDesc: 'The premium platform connecting subscribers with verified fitness coaches across the Arab world.',
    fc1T: 'Platform', fc1L1: 'Browse Trainers', fc1L2: 'How It Works', fc1L3: 'Pricing', fc1L4: 'For Trainers',
    fc2T: 'Company', fc2L1: 'About Us', fc2L2: 'Blog', fc2L3: 'Careers', fc2L4: 'Contact',
    fc3T: 'Legal', fc3L1: 'Privacy Policy', fc3L2: 'Terms of Service', fc3L3: 'Refund Policy',
    footerCopy: '© 2026 FITLEEX. All rights reserved.',
    store1Sub: 'Download on the', store2Sub: 'Get it on',
    authTitle: 'Welcome back', authCreateTitle: 'Create your account',
    authLoginBtn: 'Login', authSignupBtn: 'Sign up',
    emailLabel: 'Email', passwordLabel: 'Password', forgotPw: 'Forgot password?',
    noAccount: "Don't have an account?", signUp: 'Sign up',
    hasAccount: 'Already have an account?', login: 'Login',
    joinAs: 'I want to join as a...',
    subRole: 'Subscriber', subRoleDesc: 'Find a coach and start training', subRoleBadge: 'Free · Instant access',
    trainerRole: 'Trainer', trainerRoleDesc: 'Coach clients and build your business', trainerRoleBadge: 'Pending admin approval',
    createAccount: 'Create account', fullName: 'Full name', firstName: 'First name', lastName: 'Last name',
    phone: 'Phone number', preferredLang: 'Preferred Language', terms: 'By signing up you agree to our', termsLink: 'Terms of Service', andLink: 'and', privacyLink: 'Privacy Policy',
    applyTrainer: 'Apply as a trainer', trainerApproval: '💪 Requires admin approval · 24-48 hrs',
    step1of3: 'Step 1 of 3 — Personal info', step2of3: 'Step 2 of 3 — Specialty & details', step3of3: 'Step 3 of 3 — Verification',
    instagram: 'Instagram handle', specialty: 'Specialty', country: 'Country',
    passMin: 'Min 8 characters',
    idDoc: 'National ID / Passport', idDocSub: 'JPG or PDF · Max 5MB',
    certDoc: 'Fitness certification (optional)', certDocSub: 'NASM, ACE, ISSA, etc.',
    uploadBtn: 'Upload', uploading: 'Uploading...', uploaded: '✓ Uploaded',
    verifyNote: 'After submitting, our team reviews within',
    verifyHours: '24-48 hours',
    submitApp: 'Submit application', back: '← Back', next: 'Next →',
    successSubTitle: 'Account created!',
    successSubDesc: 'Welcome to FITLEEX! Browse trainers and subscribe to start your fitness journey.',
    findCoach: 'Find my coach →',
    successTrTitle: 'Application submitted!',
    successTrDesc: 'Our team will review your profile within 24-48 hours. You\'ll receive an email once approved.',
    underReview: 'Status: Under review 🔍', gotIt: 'Got it!',
    trApplyTitle: 'Apply as a trainer', trApplySubStep: 'Step',
    personalInfo: 'Personal information',
    specialtyPlans: 'Specialty & Plans', plansLabel: "Subscription plans you'll offer",
    planName: 'Plan name (e.g. Muscle Builder)', planDays: 'days', aed: 'AED',
    addPlan: '+ Add another plan', commission: '💰 Platform commission: 20%',
    commissionDesc: 'You keep 80% of every subscription. Payments are processed automatically and transferred to your account monthly.',
    verificationDocs: 'Verification documents',
    verificationDesc: 'We verify all trainers to ensure quality and trust for subscribers. Upload your documents below.',
    trSuccess: 'Application submitted!',
    trSuccessDesc: "Our team will review your application within 24-48 hours. You'll receive an email once approved.",
    loginLoading: 'Logging in...', creating: 'Creating account...', submitting: 'Submitting...',
    welcomeBack: 'Welcome back!', pleaseEnterEmail: 'Please enter your email',
  },
  ar: {
    navHow: 'كيف يعمل', navTrainers: 'المدربون', navPricing: 'الأسعار', navJoin: 'للمدربين',
    navLogin: 'تسجيل الدخول', navCta: 'ابدأ الآن',
    heroBadge: '١٨٦ مدرب موثّق',
    heroH1a: 'تدرّب مع ', heroH1em: 'أفضل المدربين', heroH1b: ' في العالم.',
    heroSub: 'تواصل مع مدربين لياقة معتمدين. احصل على خطة تدريب وتغذية مخصصة. تتبّع تقدمك. كل شيء في منصة واحدة.',
    heroBtn1: 'اختر مدربك', heroBtn2: 'هل أنت مدرب؟ →',
    ht1: 'مشترك', ht2: 'مدرب معتمد', ht3: 'متوسط التقييم',
    hcName: 'خالد سلطان', hcSpec: 'كمال الأجسام · بناء العضلات', hcClients: '٨٤٧ عميل · 🇸🇦 السعودية',
    hcPrice: 'من ٢٩٩ د.إ / ٣٢ يوماً', hcProgress: '٧٨٪ من المقاعد ممتلئة',
    hf1Lbl: 'تقدم الأسبوع ٣', hf1Sub: 'منذ بداية رحلتك 🔥', hf1Days: 'يوم ٢٢ من ٣٢',
    hf2Lbl: 'تمارين اليوم', hf2Ex1: 'ضغط الصدر · 4×10', hf2Ex2: 'بنش مائل · 3×12', hf2Ex3: 'كيبل فلاي · 3×15',
    hf3Lbl: 'رسالة جديدة', hf3Msg: 'عمل رائع اليوم! زد وزن الضغط إلى 85 كجم الأسبوع القادم 💪',
    stat1: 'مدرب معتمد', stat2: 'مشترك', stat4: 'متوسط تقييم المنصة',
    audLabel: 'لمن FITLEEX؟', audTitle: 'لنغيّر نمط حياتك',
    audSubBadge: 'للمشتركين', audSubTitle: 'حقّق أهدافك في اللياقة مع مدرب ملتزم بك.',
    audSubDesc: 'توقف عن متابعة مقاطع التمارين العشوائية. احصل على خطة مخصصة من مدرب موثّق وتتبّع تقدمك الحقيقي أسبوعاً بأسبوع.',
    asf1: 'مدربون موثّقون فقط', asf2: 'خطط تدريب وتغذية مخصصة', asf3: 'محادثة مباشرة مع مدربك',
    asf4: 'تتبّع التقدم الأسبوعي', asf5: 'ادفع مع Tabby أو Tamara — 4 دفعات',
    audSubBtn: 'اختر مدربي →',
    audTrBadge: 'للمدربين', audTrTitle: 'ابنِ أعمالك في التدريب. نحن نتكفّل بالباقي.',
    audTrDesc: 'ركّز على التدريب. نحن نتكفّل بالمدفوعات والجدولة وإدارة العملاء. اكسب 80٪ من كل اشتراك — بدون رسوم خفية.',
    atf1: 'إدارة الاشتراكات تلقائياً', atf2: 'إدارة خطط المشتركين — تدريب وتغذية',
    atf3: 'أدِر كل شيء من تطبيق هاتفك', atf4: 'مقاطع توضيحية لكل تمرين',
    atf5: 'أدِر مشتركيك من أي مكان في العالم',
    audTrBtn: 'انضم كمدرب →',
    hiwLabel: 'العملية', hiwTitle: 'ابدأ في 4 خطوات بسيطة',
    hiwSub: 'من التسجيل إلى تمرينك الأول في دقائق — وليس أياماً.',
    step1T: 'تصفّح المدربين', step1D: 'صفّي حسب التخصص والبلد والسعر والتقييم. اقرأ آراء المشتركين الحقيقيين.',
    step2T: 'اشترك', step2D: 'اختر خطة وادفع بأمان. قسّم إلى 4 دفعات مع Tabby أو Tamara.',
    step3T: 'احصل على خطتك', step3D: 'مدربك يبني خطة تدريب وتغذية مخصصة خصيصاً لك.',
    step4T: 'تدرّب وتتبّع', step4D: 'اتّبع خطتك، سجّل تقدمك الأسبوعي، تحدّث مع مدربك، وشاهد النتائج الحقيقية.',
    trLabel: 'مدربونا', trTitle: 'تعرّف على المدربين الموثّقين',
    trSub: 'كل مدرب موثّق بالهوية وبيانات الاعتماد والدليل الاجتماعي. بدون اختصارات.',
    tc1Spec: 'كمال الأجسام · بناء العضلات', tc1Cl: 'عميل', tc1Co: 'السعودية',
    tc2Spec: 'التغذية · خسارة الوزن', tc2Cl: 'عميل', tc2Co: 'الإمارات',
    tc3Spec: 'لياقة المرأة · بيلاتيس', tc3Cl: 'عميل', tc3Co: 'لبنان',
    viewAll: 'عرض جميع المدربين الـ 186 →',
    payLabel: 'مدفوعات مرنة', payTitle: 'ادفع بطريقتك — حتى على 4 أقساط',
    paySub: 'نقبل جميع طرق الدفع الرئيسية. استخدم Tabby أو Tamara لتقسيم اشتراكك إلى 4 أقساط بدون فوائد.',
    pm1Name: 'بطاقة ائتمان / خصم', pm1Desc: 'Visa, Mastercard, mada, Apple Pay',
    pm3Desc: 'اشترِ الآن وادفع لاحقاً', pm3Bnpl: '4 دفعات · 0٪ فوائد',
    pm4Desc: 'قسّم مشترياتك بسهولة', pm4Bnpl: '3 دفعات · 0٪ فوائد',
    payHowLbl: 'كيف يعمل',
    pstep1: 'تصفّح المدربين واختر مدربك',
    pstep2: 'أنشئ حساباً مجانياً في 30 ثانية',
    pstep3: 'اشترك واختر طريقة الدفع',
    payAcceptedLbl: 'المدفوعات المقبولة',
    tabbyLabel: '4 دفعات · 0٪ فوائد', tamaraLabel: '3 دفعات · 0٪ فوائد',
    payGetStarted: 'ابدأ الآن',
    paySecurity: 'مؤمَّن بتشفير SSL 256-bit',
    revLabel: 'ماذا يقول المشتركون', revTitle: 'نتائج المشتركين',
    rv1: '"المدرب خالد غيّر تماماً طريقة تدريبي. في 64 يوماً اكتسبت 4 كجم عضلات وخسرت 2 كجم دهون. المتابعة الأسبوعية أبقتني على المسار."',
    rv1Meta: 'بناء العضلات · 64 يوماً · 🇸🇦',
    rv2: '"خطة التغذية من نور كانت شيئاً آخر — تفصيلية وعملية ومناسبة لأسلوب حياتي. خسرت 8 كجم في أول اشتراكين!"',
    rv2Meta: 'خسارة الوزن · 32 يوماً · 🇦🇪',
    rv3: '"استخدمت Tabby لتقسيم الدفع — أسهل بكثير. الخطة كانت جاهزة بعد ساعات من الاشتراك. مدربي يرد على كل رسالة في نفس اليوم."',
    rv3Meta: 'بناء العضلات · 64 يوماً · 🇰🇼',
    tctaBadge: 'لمحترفي اللياقة', tctaTitle: 'انضم كمدرب.\nابنِ أعمالك.',
    tctaSub: 'أنشئ ملفك الشخصي، ابنِ خططك، وابدأ بقبول المشتركين. نحن نتكفّل بالمدفوعات والتكنولوجيا والنمو — أنت فقط ركّز على التدريب.',
    tctaBtn1: 'قدّم كمدرب →', tctaBtn2: 'اعرف المزيد',
    footerDesc: 'المنصة المتميزة التي تربط المشتركين بمدربي اللياقة الموثّقين في العالم العربي.',
    fc1T: 'المنصة', fc1L1: 'تصفّح المدربين', fc1L2: 'كيف يعمل', fc1L3: 'الأسعار', fc1L4: 'للمدربين',
    fc2T: 'الشركة', fc2L1: 'من نحن', fc2L2: 'المدونة', fc2L3: 'وظائف', fc2L4: 'تواصل معنا',
    fc3T: 'قانوني', fc3L1: 'سياسة الخصوصية', fc3L2: 'شروط الخدمة', fc3L3: 'سياسة الاسترداد',
    footerCopy: '© 2026 FITLEEX. جميع الحقوق محفوظة.',
    store1Sub: 'تحميل من', store2Sub: 'احصل عليه من',
    authTitle: 'مرحباً بعودتك', authCreateTitle: 'أنشئ حسابك',
    authLoginBtn: 'تسجيل الدخول', authSignupBtn: 'إنشاء حساب',
    emailLabel: 'البريد الإلكتروني', passwordLabel: 'كلمة المرور', forgotPw: 'نسيت كلمة المرور؟',
    noAccount: 'ليس لديك حساب؟', signUp: 'إنشاء حساب',
    hasAccount: 'لديك حساب بالفعل؟', login: 'تسجيل الدخول',
    joinAs: 'أريد الانضمام كـ...',
    subRole: 'مشترك', subRoleDesc: 'ابحث عن مدرب وابدأ التدريب', subRoleBadge: 'مجاني · وصول فوري',
    trainerRole: 'مدرب', trainerRoleDesc: 'درّب عملاء وابنِ أعمالك', trainerRoleBadge: 'يتطلب موافقة الإدارة',
    createAccount: 'إنشاء الحساب', fullName: 'الاسم الكامل', firstName: 'الاسم الأول', lastName: 'اسم العائلة',
    phone: 'رقم الجوال', preferredLang: 'اللغة المفضلة', terms: 'بالتسجيل توافق على', termsLink: 'شروط الخدمة', andLink: 'و', privacyLink: 'سياسة الخصوصية',
    applyTrainer: 'قدّم كمدرب', trainerApproval: '💪 يتطلب موافقة الإدارة · 24-48 ساعة',
    step1of3: 'الخطوة 1 من 3 — المعلومات الشخصية', step2of3: 'الخطوة 2 من 3 — التخصص والتفاصيل', step3of3: 'الخطوة 3 من 3 — التحقق',
    instagram: 'حساب إنستغرام', specialty: 'التخصص', country: 'الدولة',
    passMin: '8 أحرف كحد أدنى',
    idDoc: 'الهوية الوطنية / جواز السفر', idDocSub: 'JPG أو PDF · بحد أقصى 5MB',
    certDoc: 'شهادة اللياقة (اختياري)', certDocSub: 'NASM, ACE, ISSA, إلخ.',
    uploadBtn: 'رفع', uploading: 'جارٍ الرفع...', uploaded: '✓ تم الرفع',
    verifyNote: 'بعد التقديم، يراجع فريقنا خلال',
    verifyHours: '24-48 ساعة',
    submitApp: 'إرسال الطلب', back: '← رجوع', next: 'التالي →',
    successSubTitle: 'تم إنشاء الحساب!',
    successSubDesc: 'مرحباً بك في FITLEEX! تصفّح المدربين واشترك لتبدأ رحلتك في اللياقة.',
    findCoach: 'اختر مدربي →',
    successTrTitle: 'تم إرسال الطلب!',
    successTrDesc: 'سيراجع فريقنا ملفك خلال 24-48 ساعة. ستتلقى بريداً إلكترونياً عند الموافقة.',
    underReview: 'الحالة: قيد المراجعة 🔍', gotIt: 'فهمت!',
    trApplyTitle: 'قدّم كمدرب', trApplySubStep: 'الخطوة',
    personalInfo: 'المعلومات الشخصية',
    specialtyPlans: 'التخصص والخطط', plansLabel: 'خطط الاشتراك التي ستقدمها',
    planName: 'اسم الخطة (مثال: بناء العضلات)', planDays: 'يوم', aed: 'درهم',
    addPlan: '+ إضافة خطة أخرى', commission: '💰 عمولة المنصة: 20٪',
    commissionDesc: 'تحتفظ بـ 80٪ من كل اشتراك. تُعالَج المدفوعات تلقائياً وتُحوَّل إلى حسابك شهرياً.',
    verificationDocs: 'وثائق التحقق',
    verificationDesc: 'نتحقق من جميع المدربين لضمان الجودة والثقة للمشتركين. ارفع وثائقك أدناه.',
    trSuccess: 'تم إرسال الطلب!',
    trSuccessDesc: 'سيراجع فريقنا طلبك خلال 24-48 ساعة. ستتلقى بريداً إلكترونياً عند الموافقة.',
    loginLoading: 'جارٍ تسجيل الدخول...', creating: 'جارٍ إنشاء الحساب...', submitting: 'جارٍ الإرسال...',
    welcomeBack: 'مرحباً بعودتك!', pleaseEnterEmail: 'يرجى إدخال بريدك الإلكتروني',
  },
}

type Lang = 'en' | 'ar'
type AuthPanel = 'login' | 'role' | 'subscriber' | 'trainer' | 'success-sub' | 'success-trainer'
type TrainerAppStep = 1 | 2 | 3 | 4

// ── Component ──────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter()
  const [lang, setLangState] = useState<Lang>('en')
  const [authOpen, setAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login')
  const [authPanel, setAuthPanel] = useState<AuthPanel>('role')
  const [trainerModal, setTrainerModal] = useState(false)
  const [trainerStep, setTrainerStep] = useState<TrainerAppStep>(1)
  const [trainerStepInAuth, setTrainerStepInAuth] = useState(1)
  const [idUploaded, setIdUploaded] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<{ show: boolean; icon: string; text: string }>({ show: false, icon: '', text: '' })
  const [authError, setAuthError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Login form refs
  const loginEmailRef = useRef<HTMLInputElement>(null)
  const loginPasswordRef = useRef<HTMLInputElement>(null)

  // Subscriber signup refs
  const subFirstRef = useRef<HTMLInputElement>(null)
  const subLastRef = useRef<HTMLInputElement>(null)
  const subEmailRef = useRef<HTMLInputElement>(null)
  const subPhoneRef = useRef<HTMLInputElement>(null)
  const subPasswordRef = useRef<HTMLInputElement>(null)
  const subCountryRef = useRef<HTMLSelectElement>(null)

  // Trainer modal refs
  const trFirstRef = useRef<HTMLInputElement>(null)
  const trLastRef = useRef<HTMLInputElement>(null)
  const trEmailRef = useRef<HTMLInputElement>(null)
  const trSpecialtyRef = useRef<HTMLSelectElement>(null)
  const trCountryRef = useRef<HTMLSelectElement>(null)
  const trPasswordRef = useRef<HTMLInputElement>(null)

  const t = useCallback((key: keyof typeof T.en) => (T[lang] as typeof T.en)[key] ?? T.en[key], [lang])

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.lp .reveal').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  // Close modals on overlay click
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>, close: () => void) => {
    if (e.target === e.currentTarget) close()
  }

  function showToast(icon: string, text: string) {
    setToast({ show: true, icon, text })
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3500)
  }

  function openAuth(tab: 'login' | 'signup') {
    setAuthTab(tab)
    setAuthPanel(tab === 'login' ? 'login' : 'role')
    setAuthError(null)
    setAuthOpen(true)
  }

  function openAuthAs(panel: 'subscriber' | 'trainer') {
    setAuthTab('signup')
    setAuthPanel(panel)
    setTrainerStepInAuth(1)
    setAuthError(null)
    setAuthOpen(true)
  }

  function handleLogin() {
    const fd = new FormData()
    fd.append('email', loginEmailRef.current?.value ?? '')
    fd.append('password', loginPasswordRef.current?.value ?? '')
    setAuthError(null)
    startTransition(async () => {
      const result = await login(fd)
      if (!result || result.success === false) {
        setAuthError((result as any)?.error ?? 'حدث خطأ')
      } else {
        router.push((result as any).dest ?? '/')
      }
    })
  }

  function handleSubSignup() {
    const fd = new FormData()
    const fullName = `${subFirstRef.current?.value ?? ''} ${subLastRef.current?.value ?? ''}`.trim()
    fd.append('full_name', fullName)
    fd.append('email', subEmailRef.current?.value ?? '')
    fd.append('password', subPasswordRef.current?.value ?? '')
    fd.append('country', subCountryRef.current?.value ?? 'SA')
    fd.append('language', lang)
    setAuthError(null)
    startTransition(async () => {
      const result = await signupSubscriber(fd)
      if (result && result.success === false) setAuthError(result.error)
    })
  }

  function handleTrainerSignup() {
    const fd = new FormData()
    fd.append('full_name', `${trFirstRef.current?.value ?? ''} ${trLastRef.current?.value ?? ''}`.trim())
    fd.append('email', trEmailRef.current?.value ?? '')
    fd.append('password', trPasswordRef.current?.value ?? '')
    fd.append('country', trCountryRef.current?.value ?? 'SA')
    fd.append('specialty', trSpecialtyRef.current?.value ?? '')
    fd.append('language', lang)
    setAuthError(null)
    startTransition(async () => {
      const result = await signupTrainer(fd)
      if (result && result.success === false) setAuthError(result.error)
      else setAuthPanel('success-trainer')
    })
  }

  function openTrainerSignup() {
    setTrainerModal(true)
    setTrainerStep(1)
  }

  function simulateUpload(key: string) {
    setTimeout(() => setIdUploaded(u => ({ ...u, [key]: true })), 1200)
  }

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const trainerStepLabel = trainerStepInAuth === 1 ? t('step1of3') : trainerStepInAuth === 2 ? t('step2of3') : t('step3of3')

  return (
    <div className={`lp${lang === 'ar' ? ' ar' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>


      {/* ── NAV ── */}
      <nav>
        <div className="nav-logo">
          <div className="nav-logo-mark">FF</div>
          <div className="nav-logo-txt">FIT<span>FEEZ</span></div>
        </div>
        <div className="nav-links">
          <button className="nav-link" onClick={() => scrollTo('how-it-works')}>{t('navHow')}</button>
          <button className="nav-link" onClick={() => scrollTo('trainers')}>{t('navTrainers')}</button>
          <button className="nav-link" onClick={() => scrollTo('pricing')}>{t('navPricing')}</button>
          <button className="nav-link" onClick={() => scrollTo('trainer-join')}>{t('navJoin')}</button>
        </div>
        <div className="nav-right">
          <div className="lang-sw">
            <button className={`lb${lang === 'en' ? ' active' : ''}`} onClick={() => setLangState('en')}>EN</button>
            <button className={`lb${lang === 'ar' ? ' active' : ''}`} onClick={() => setLangState('ar')}>ع</button>
          </div>
          <button className="nav-btn nav-login" onClick={() => openAuth('login')}>{t('navLogin')}</button>
          <button className="nav-btn nav-cta" onClick={() => openAuth('signup')}>{t('navCta')}</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-inner">
          <div>
            <div className="hero-badge">
              <div className="hero-badge-dot" />
              <span>{t('heroBadge')}</span>
            </div>
            <h1 className="hero-h1">
              {t('heroH1a')}<span className="accent underline">{t('heroH1em')}</span>{t('heroH1b')}
            </h1>
            <p className="hero-sub">{t('heroSub')}</p>
            <div className="hero-ctas">
              <button className="hero-btn-p" onClick={() => openAuth('signup')}>{t('heroBtn1')}</button>
              <button className="hero-btn-s" onClick={() => openAuth('signup')}>{t('heroBtn2')}</button>
            </div>
            <div className="hero-trust">
              <div className="trust-stat">
                <div className="trust-num">3,800+</div>
                <div className="trust-lbl">{t('ht1')}</div>
              </div>
              <div className="trust-div" />
              <div className="trust-stat">
                <div className="trust-num">186</div>
                <div className="trust-lbl">{t('ht2')}</div>
              </div>
              <div className="trust-div" />
              <div className="trust-stat">
                <div className="trust-num">4.8★</div>
                <div className="trust-lbl">{t('ht3')}</div>
              </div>
            </div>
          </div>

          {/* Hero visual cards */}
          <div className="hero-visual">
            <div className="hv-card hv-main">
              <div className="card-trainer">
                <div className="card-av" style={{ background: '#C8F04B', color: '#000' }}>KS</div>
                <div>
                  <div className="card-name">{t('hcName')}</div>
                  <div className="card-spec">{t('hcSpec')}</div>
                </div>
              </div>
              <div className="card-stars">★★★★★</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{t('hcClients')}</div>
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text2)' }}>{t('hcPrice')}</div>
              <div className="card-pbar"><div className="card-pfill" style={{ width: '78%' }} /></div>
              <div className="card-progress-label">{t('hcProgress')}</div>
            </div>

            <div className="hv-card hv-float1" style={{ background: 'linear-gradient(135deg,#1C2A0E,#0E1508)' }}>
              <div className="float-label">{t('hf1Lbl')}</div>
              <div className="float-big">-4.2 kg</div>
              <div className="float-sub">{t('hf1Sub')}</div>
              <div className="card-pbar" style={{ marginTop: 12, background: 'rgba(255,255,255,.1)' }}>
                <div className="card-pfill" style={{ width: '65%', background: '#fff' }} />
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.5)', marginTop: 5, fontFamily: 'var(--mono)' }}>{t('hf1Days')}</div>
            </div>

            <div className="hv-card hv-float2" style={{ padding: 14 }}>
              <div className="float-label">{t('hf2Lbl')}</div>
              <div className="check-row"><div className="check-done">✓</div><span style={{ fontSize: 12 }}>{t('hf2Ex1')}</span></div>
              <div className="check-row"><div className="check-done">✓</div><span style={{ fontSize: 12 }}>{t('hf2Ex2')}</span></div>
              <div className="check-row"><div className="check-todo" /><span style={{ fontSize: 12, color: 'var(--text2)' }}>{t('hf2Ex3')}</span></div>
            </div>

            <div className="hv-card hv-float3" style={{ background: 'rgba(77,158,255,.06)', borderColor: 'rgba(77,158,255,.2)' }}>
              <div className="float-label">{t('hf3Lbl')}</div>
              <div style={{ fontSize: 12, color: 'var(--text)' }}>{t('hf3Msg')}</div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 6, fontFamily: 'var(--mono)' }}>Coach Khalid · 10:24</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS STRIP ── */}
      <div className="stats-strip reveal">
        <div className="stats-inner">
          <div className="stat-item"><div className="stat-num">186</div><div className="stat-lbl">{t('stat1')}</div></div>
          <div className="stat-item"><div className="stat-num">3,842</div><div className="stat-lbl">{t('stat2')}</div></div>
          <div className="stat-item"><div className="stat-num">4.8★</div><div className="stat-lbl">{t('stat4')}</div></div>
        </div>
      </div>

      {/* ── AUDIENCE — SUBSCRIBER ── */}
      <section className="reveal">
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div className="section-label">{t('audLabel')}</div>
          <h2 className="section-title">{t('audTitle')}</h2>
        </div>
        <div style={{ maxWidth: '100%', margin: '0 auto' }}>
          <div className="aud-card aud-subscriber" style={{ minHeight: 520, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '60px 40px' }}>
            <div className="aud-glow" />
            <div className="aud-badge green">{t('audSubBadge')}</div>
            <div className="aud-title">{t('audSubTitle')}</div>
            <div className="aud-sub">{t('audSubDesc')}</div>
            <div className="aud-features" style={{ textAlign: lang === 'ar' ? 'right' : 'left', display: 'inline-flex', flexDirection: 'column', gap: 10 }}>
              {(['asf1','asf2','asf3','asf4','asf5'] as const).map((k,i) => (
                <div key={k} className="aud-feat">
                  <span className="aud-feat-icon">{['✅','📋','💬','📊','💳'][i]}</span>
                  <span>{t(k)}</span>
                </div>
              ))}
            </div>
            <button className="aud-btn green" style={{ marginTop: 24 }} onClick={() => openAuth('signup')}>{t('audSubBtn')}</button>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="reveal">
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div className="section-label">{t('hiwLabel')}</div>
          <h2 className="section-title">{t('hiwTitle')}</h2>
          <p className="section-sub" style={{ margin: '0 auto' }}>{t('hiwSub')}</p>
        </div>
        <div className="steps">
          {[
            { num: '01', t: 'step1T' as const, d: 'step1D' as const },
            { num: '02', t: 'step2T' as const, d: 'step2D' as const },
            { num: '03', t: 'step3T' as const, d: 'step3D' as const },
            { num: '04', t: 'step4T' as const, d: 'step4D' as const },
          ].map((s, i) => (
            <div key={s.num} className="step reveal">
              <div className="step-num">{s.num}</div>
              {i < 3 && <div className="step-line" />}
              <div className="step-title">{t(s.t)}</div>
              <div className="step-desc">{t(s.d)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRAINERS ── */}
      <section id="trainers" className="reveal">
        <div className="section-label">{t('trLabel')}</div>
        <h2 className="section-title">{t('trTitle')}</h2>
        <p className="section-sub">{t('trSub')}</p>
        <div className="trainers-grid">
          {[
            { initials: 'KS', color: '#C8F04B', textColor: '#000', name: 'Khalid Sultan', spec: 'tc1Spec' as const, clients: 847, rating: '★ 4.9', flag: '🇸🇦', co: 'tc1Co' as const, bg: 'linear-gradient(135deg,#1C2A0E,#0a0f05)' },
            { initials: 'NR', color: '#FF5A36', textColor: '#fff', name: 'Nour Rashid', spec: 'tc2Spec' as const, clients: 412, rating: '★ 4.8', flag: '🇦🇪', co: 'tc2Co' as const, bg: 'linear-gradient(135deg,#1A0808,#0f0404)' },
            { initials: 'LH', color: '#4D9EFF', textColor: '#fff', name: 'Lina Hamdan', spec: 'tc3Spec' as const, clients: 189, rating: '★ 4.9', flag: '🇱🇧', co: 'tc3Co' as const, bg: 'linear-gradient(135deg,#08121A,#040a0f)' },
          ].map(tr => (
            <div key={tr.name} className="trainer-card" dir="ltr">
              <div className="tc-banner" style={{ background: tr.bg }}>
                <div className="tc-av" style={{ background: tr.color, color: tr.textColor, position: 'relative' }}>
                  {tr.initials}
                  <div className="verified-badge">✓</div>
                </div>
              </div>
              <div className="tc-body">
                <div className="tc-name">{tr.name}</div>
                <div className="tc-spec">{t(tr.spec)}</div>
                <div className="tc-stats">
                  <div className="tc-stat"><div className="tc-sv">{tr.clients}</div><div className="tc-sl">{t(tr.co)}</div></div>
                  <div className="tc-sdiv" />
                  <div className="tc-stat"><div className="tc-sv" style={{ color: '#FFB800' }}>{tr.rating}</div><div className="tc-sl">Rating</div></div>
                  <div className="tc-sdiv" />
                  <div className="tc-stat"><div className="tc-sv">{tr.flag}</div><div className="tc-sl">{t(tr.co)}</div></div>
                </div>
                <div className="tc-footer">
                  <button className="sub-btn" onClick={() => openAuth('signup')}>{lang === 'ar' ? 'عرض الملف' : 'View profile'}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <button onClick={() => openAuth('signup')} style={{ padding: '12px 32px', border: '1px solid var(--border2)', borderRadius: 100, background: 'transparent', color: 'var(--text2)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all .15s' }}>
            {t('viewAll')}
          </button>
        </div>
      </section>

      {/* ── PAYMENT ── */}
      <section id="pricing" className="reveal" style={{ paddingTop: 60 }}>
        <div className="pay-section">
          <div>
            <div className="section-label">{t('payLabel')}</div>
            <h2 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.1, marginBottom: 14 }}>{t('payTitle')}</h2>
            <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 8 }}>{t('paySub')}</p>
            <div className="pay-methods">
              <div className="pay-card" style={{ gridColumn: '1/-1' }}>
                <div className="pay-icon" style={{ background: 'rgba(200,240,75,.1)' }}>💳</div>
                <div>
                  <div className="pay-name">{t('pm1Name')}</div>
                  <div className="pay-desc">{t('pm1Desc')}</div>
                </div>
              </div>
              <div className="pay-card">
                <div className="pay-icon" style={{ background: 'rgba(200,240,75,.12)' }}>🟢</div>
                <div>
                  <div className="pay-name">Tabby</div>
                  <div className="pay-desc">{t('pm3Desc')}</div>
                  <div className="pay-bnpl bnpl-tabby">{t('pm3Bnpl')}</div>
                </div>
              </div>
              <div className="pay-card">
                <div className="pay-icon" style={{ background: 'rgba(77,158,255,.1)' }}>🔵</div>
                <div>
                  <div className="pay-name">Tamara</div>
                  <div className="pay-desc">{t('pm4Desc')}</div>
                  <div className="pay-bnpl bnpl-tamara">{t('pm4Bnpl')}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="pay-visual">
            <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{t('payHowLbl')}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(['pstep1','pstep2','pstep3'] as const).map((k, i) => (
                <div key={k} className="pstep-row">
                  <div className="pstep-num">{i + 1}</div>
                  <div className="pstep-txt">{t(k)}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>{t('payAcceptedLbl')}</div>
              <div className="pay-badge-row" style={{ marginBottom: 10 }}>
                {['Visa', 'Mastercard', 'mada', 'Apple Pay'].map(b => (
                  <span key={b} className="pay-badge">{b}</span>
                ))}
              </div>
              <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, padding: '9px 12px', background: 'rgba(200,240,75,.06)', border: '1px solid rgba(200,240,75,.15)', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>Tabby</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{t('tabbyLabel')}</div>
                </div>
                <div style={{ flex: 1, padding: '9px 12px', background: 'rgba(77,158,255,.06)', border: '1px solid rgba(77,158,255,.15)', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#4D9EFF' }}>Tamara</div>
                  <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>{t('tamaraLabel')}</div>
                </div>
              </div>
            </div>

            <button onClick={() => openAuth('signup')} style={{ background: '#FF5E3A', color: '#fff' }} className="pay-confirm-btn">{t('payGetStarted')}</button>
            <div className="pay-security">🔒 <span>{t('paySecurity')}</span></div>
          </div>
        </div>
      </section>

      {/* ── REVIEWS ── */}
      <section className="reveal">
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div className="section-label">{t('revLabel')}</div>
          <h2 className="section-title">{t('revTitle')}</h2>
        </div>
        <div className="reviews-grid">
          {[
            { rv: 'rv1' as const, meta: 'rv1Meta' as const, av: 'AK', avBg: 'linear-gradient(135deg,#C8F04B,#7ab82e)', avCol: '#000', name: 'Ahmed Khalil' },
            { rv: 'rv2' as const, meta: 'rv2Meta' as const, av: 'SM', avBg: 'linear-gradient(135deg,#60a5fa,#3b82f6)', avCol: '#fff', name: 'Sara Mohammed' },
            { rv: 'rv3' as const, meta: 'rv3Meta' as const, av: 'OR', avBg: 'linear-gradient(135deg,#a78bfa,#7c3aed)', avCol: '#fff', name: 'Omar Rashed' },
          ].map(r => (
            <div key={r.name} className="review-card reveal">
              <div className="rc-stars">★★★★★</div>
              <div className="rc-text">{t(r.rv)}</div>
              <div className="rc-author">
                <div className="rc-av" style={{ background: r.avBg, color: r.avCol }}>{r.av}</div>
                <div>
                  <div className="rc-name">{r.name}</div>
                  <div className="rc-meta">{t(r.meta)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TRAINER SECTION ── */}
      <section id="trainer-section" className="reveal" style={{ paddingTop: 0 }}>
        <div style={{ maxWidth: '100%', margin: '0 auto' }}>
          <div className="aud-card aud-trainer" style={{ minHeight: 520, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '60px 40px' }}>
            <div className="aud-glow" />
            <div className="aud-badge blue">{t('audTrBadge')}</div>
            <div className="aud-title">{t('audTrTitle')}</div>
            <div className="aud-sub">{t('audTrDesc')}</div>
            <div className="aud-features" style={{ textAlign: lang === 'ar' ? 'right' : 'left', display: 'inline-flex', flexDirection: 'column', gap: 10 }}>
              {(['atf1','atf2','atf3','atf4','atf5'] as const).map((k, i) => (
                <div key={k} className="aud-feat">
                  <span className="aud-feat-icon">{['💰','🛠️','📱','🎬','🌍'][i]}</span>
                  <span>{t(k)}</span>
                </div>
              ))}
            </div>
            <button className="aud-btn blue" style={{ marginTop: 24 }} onClick={() => openAuth('signup')}>{t('audTrBtn')}</button>
          </div>
        </div>
      </section>

      {/* ── TRAINER JOIN CTA ── */}
      <section id="trainer-join" className="reveal">
        <div className="trainer-cta">
          <div className="trainer-cta-glow" />
          <div className="hero-badge" style={{ margin: '0 auto 20px', display: 'inline-flex' }}>
            <div className="hero-badge-dot" />
            <span>{t('tctaBadge')}</span>
          </div>
          <h2 style={{ fontSize: 44, fontWeight: 800, marginBottom: 14, whiteSpace: 'pre-line' }}>{t('tctaTitle')}</h2>
          <p style={{ fontSize: 17, color: 'var(--text2)', maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.6 }}>{t('tctaSub')}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="hero-btn-p" onClick={() => openAuth('signup')}>{t('tctaBtn1')}</button>
            <button className="hero-btn-s" onClick={() => scrollTo('trainer-section')}>{t('tctaBtn2')}</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer>
        <div className="footer-inner">
          <div className="footer-grid">
            <div>
              <div className="footer-brand-name">FIT<span>FEEZ</span></div>
              <div className="footer-desc">{t('footerDesc')}</div>
            </div>
            <div>
              <div className="footer-col-title">{t('fc1T')}</div>
              <button className="footer-link" onClick={() => scrollTo('trainers')}>{t('fc1L1')}</button>
              <button className="footer-link" onClick={() => scrollTo('how-it-works')}>{t('fc1L2')}</button>
              <button className="footer-link" onClick={() => scrollTo('pricing')}>{t('fc1L3')}</button>
              <button className="footer-link" onClick={() => scrollTo('trainer-join')}>{t('fc1L4')}</button>
            </div>
            <div>
              <div className="footer-col-title">{t('fc2T')}</div>
              <span className="footer-link">{t('fc2L1')}</span>
              <span className="footer-link">{t('fc2L2')}</span>
              <span className="footer-link">{t('fc2L3')}</span>
              <span className="footer-link">{t('fc2L4')}</span>
            </div>
            <div>
              <div className="footer-col-title">{t('fc3T')}</div>
              <span className="footer-link">{t('fc3L1')}</span>
              <span className="footer-link">{t('fc3L2')}</span>
              <span className="footer-link">{t('fc3L3')}</span>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-copy">{t('footerCopy')}</div>
            <div className="footer-badges">
              <a className="store-btn" href="#">
                <div className="store-icon">🍎</div>
                <div>
                  <div className="store-sub">{t('store1Sub')}</div>
                  <div className="store-name">App Store</div>
                </div>
              </a>
              <a className="store-btn" href="#">
                <div className="store-icon">▶</div>
                <div>
                  <div className="store-sub">{t('store2Sub')}</div>
                  <div className="store-name">Google Play</div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── AUTH MODAL ── */}
      {authOpen && (
        <div className="modal-overlay" onClick={e => handleOverlayClick(e, () => setAuthOpen(false))}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">
                {authPanel === 'login' ? t('authTitle') :
                 authPanel === 'success-sub' ? t('successSubTitle') :
                 authPanel === 'success-trainer' ? t('successTrTitle') :
                 t('authCreateTitle')}
              </div>
              <button className="modal-close" onClick={() => setAuthOpen(false)}>×</button>
            </div>

            {/* Tabs */}
            {(authPanel === 'login' || authPanel === 'role' || authPanel === 'subscriber' || authPanel === 'trainer') && (
              <div className="modal-tabs">
                <button
                  className={`modal-tab${authPanel === 'login' ? ' active' : ''}`}
                  onClick={() => { setAuthTab('login'); setAuthPanel('login'); setAuthError(null) }}
                >{t('authLoginBtn')}</button>
                <button
                  className={`modal-tab${authPanel !== 'login' ? ' active' : ''}`}
                  onClick={() => { setAuthTab('signup'); setAuthPanel('role'); setAuthError(null) }}
                >{t('authSignupBtn')}</button>
              </div>
            )}

            {/* LOGIN */}
            {authPanel === 'login' && (
              <div className="modal-body">
                <div>
                  <div className="form-label">{t('emailLabel')}</div>
                  <input ref={loginEmailRef} type="email" autoComplete="off" className="form-input" placeholder="your@email.com" />
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div className="form-label">{t('passwordLabel')}</div>
                    <span style={{ fontSize: 11, color: 'var(--accent)', cursor: 'pointer' }}>{t('forgotPw')}</span>
                  </div>
                  <input ref={loginPasswordRef} type="password" autoComplete="new-password" className="form-input" placeholder="••••••••" />
                </div>
                {authError && (
                  <div style={{ fontSize: 12, color: '#FF4D4D', background: 'rgba(255,77,77,.08)', border: '1px solid rgba(255,77,77,.2)', borderRadius: 8, padding: '9px 12px' }}>
                    {authError}
                  </div>
                )}
                <button
                  className="modal-btn-primary"
                  onClick={handleLogin}
                  disabled={isPending}
                  style={{ textAlign: 'center', padding: 13, borderRadius: 10, fontSize: 14, fontWeight: 800, display: 'block', width: '100%', opacity: isPending ? 0.7 : 1 }}
                >
                  {isPending ? t('loginLoading') : t('authLoginBtn')}
                </button>
                <div style={{ textAlign: 'center', fontSize: 12, color: '#555' }}>
                  {t('noAccount')}{' '}
                  <span onClick={() => { setAuthPanel('role'); setAuthError(null) }} style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 700, marginLeft: 5 }}>{t('signUp')}</span>
                </div>
              </div>
            )}

            {/* ROLE SELECT */}
            {authPanel === 'role' && (
              <div className="modal-body">
                <div style={{ fontSize: 13, color: '#888', textAlign: 'center' }}>{t('joinAs')}</div>
                <div className="modal-role-grid">
                  <div className="role-card" onClick={() => setAuthPanel('subscriber')}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>🏃</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#f0f0f0', marginBottom: 6 }}>{t('subRole')}</div>
                    <div style={{ fontSize: 11, color: '#666', lineHeight: 1.5 }}>{t('subRoleDesc')}</div>
                    <div style={{ marginTop: 10, fontSize: 11, padding: '3px 10px', background: 'rgba(200,240,75,.1)', border: '1px solid rgba(200,240,75,.2)', borderRadius: 100, color: 'var(--accent)', display: 'inline-block' }}>{t('subRoleBadge')}</div>
                  </div>
                  <div className="role-card blue" onClick={() => setAuthPanel('trainer')}>
                    <div style={{ fontSize: 36, marginBottom: 10 }}>💪</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#f0f0f0', marginBottom: 6 }}>{t('trainerRole')}</div>
                    <div style={{ fontSize: 11, color: '#666', lineHeight: 1.5 }}>{t('trainerRoleDesc')}</div>
                    <div style={{ marginTop: 10, fontSize: 11, padding: '3px 10px', background: 'rgba(77,158,255,.1)', border: '1px solid rgba(77,158,255,.2)', borderRadius: 100, color: '#4D9EFF', display: 'inline-block' }}>{t('trainerRoleBadge')}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', fontSize: 12, color: '#555' }}>
                  {t('hasAccount')}{' '}
                  <span onClick={() => setAuthPanel('login')} style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 700 }}>{t('login')}</span>
                </div>
              </div>
            )}

            {/* SUBSCRIBER FORM */}
            {authPanel === 'subscriber' && (
              <div className="modal-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <button onClick={() => { setAuthPanel('role'); setAuthError(null) }} style={{ background: 'transparent', border: 'none', color: '#666', fontSize: 18, cursor: 'pointer', padding: 0 }}>←</button>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{t('createAccount')}</div>
                    <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 1 }}>🏃 {t('subRole')} · {t('subRoleBadge')}</div>
                  </div>
                </div>
                <div className="form-grid-2">
                  <div><div className="form-label">{t('firstName')}</div><input ref={subFirstRef} type="text" className="form-input" placeholder="Ahmed" /></div>
                  <div><div className="form-label">{t('lastName')}</div><input ref={subLastRef} type="text" className="form-input" placeholder="Khalil" /></div>
                </div>
                <div><div className="form-label">{t('emailLabel')}</div><input ref={subEmailRef} type="email" className="form-input" placeholder="your@email.com" /></div>
                <div><div className="form-label">{t('phone')}</div><input ref={subPhoneRef} type="tel" className="form-input" placeholder="+966 5x xxx xxxx" /></div>
                <div><div className="form-label">{t('country')}</div>
                  <select ref={subCountryRef} className="form-select">
                    <option value="SA">🇸🇦 Saudi Arabia</option><option value="AE">🇦🇪 UAE</option><option value="KW">🇰🇼 Kuwait</option>
                    <option value="QA">🇶🇦 Qatar</option><option value="BH">🇧🇭 Bahrain</option><option value="OM">🇴🇲 Oman</option>
                    <option value="JO">🇯🇴 Jordan</option><option value="EG">🇪🇬 Egypt</option><option value="LB">🇱🇧 Lebanon</option>
                  </select>
                </div>
                <div><div className="form-label">{t('passwordLabel')}</div><input ref={subPasswordRef} type="password" className="form-input" placeholder={t('passMin')} /></div>
                <div style={{ fontSize: 11, color: '#444', lineHeight: 1.6 }}>
                  {t('terms')} <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>{t('termsLink')}</span> {t('andLink')} <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>{t('privacyLink')}</span>
                </div>
                {authError && (
                  <div style={{ fontSize: 12, color: '#FF4D4D', background: 'rgba(255,77,77,.08)', border: '1px solid rgba(255,77,77,.2)', borderRadius: 8, padding: '9px 12px' }}>
                    {authError}
                  </div>
                )}
                <button
                  className="modal-btn-primary"
                  onClick={handleSubSignup}
                  disabled={isPending}
                  style={{ textAlign: 'center', padding: 13, borderRadius: 10, fontSize: 14, fontWeight: 800, display: 'block', width: '100%', color: '#000', opacity: isPending ? 0.7 : 1 }}
                >
                  {isPending ? t('creating') : t('createAccount')}
                </button>
              </div>
            )}

            {/* TRAINER FORM IN AUTH MODAL */}
            {authPanel === 'trainer' && (
              <div className="modal-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <button onClick={() => setAuthPanel('role')} style={{ background: 'transparent', border: 'none', color: '#666', fontSize: 18, cursor: 'pointer', padding: 0 }}>←</button>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800 }}>{t('applyTrainer')}</div>
                    <div style={{ fontSize: 11, color: '#4D9EFF', marginTop: 1 }}>{t('trainerApproval')}</div>
                  </div>
                </div>
                <div className="tr-progress-bars">
                  {[1,2,3].map(s => <div key={s} className={`tr-bar${s <= trainerStepInAuth ? ' active' : ''}`} />)}
                </div>
                <div style={{ fontSize: 11, color: '#666', fontFamily: 'var(--mono)' }}>{trainerStepLabel}</div>

                {trainerStepInAuth === 1 && (
                  <>
                    <div className="form-grid-2">
                      <div><div className="form-label">{t('firstName')}</div><input ref={trFirstRef} type="text" autoComplete="off" className="form-input" style={{ borderColor: '#252525' }} placeholder="Khalid" /></div>
                      <div><div className="form-label">{t('lastName')}</div><input ref={trLastRef} type="text" autoComplete="off" className="form-input" style={{ borderColor: '#252525' }} placeholder="Sultan" /></div>
                    </div>
                    <div><div className="form-label">{t('emailLabel')}</div><input ref={trEmailRef} type="email" autoComplete="off" className="form-input" style={{ borderColor: '#252525' }} placeholder="your@email.com" /></div>
                    <div><div className="form-label">{t('phone')}</div><input type="tel" autoComplete="off" className="form-input" style={{ borderColor: '#252525' }} placeholder="+966 5x xxx xxxx" /></div>
                    <button className="modal-btn-blue" onClick={() => setTrainerStepInAuth(2)}>{t('next')}</button>
                  </>
                )}

                {trainerStepInAuth === 2 && (
                  <>
                    <div><div className="form-label">{t('specialty')}</div>
                      <select ref={trSpecialtyRef} className="form-select">
                        <option value="Bodybuilding & Muscle Gain">Bodybuilding &amp; Muscle Gain</option>
                        <option value="Weight Loss & Fat Burning">Weight Loss &amp; Fat Burning</option>
                        <option value="Nutrition & Diet Coaching">Nutrition &amp; Diet Coaching</option>
                        <option value="Women's Fitness">Women's Fitness</option>
                        <option value="CrossFit & Performance">CrossFit &amp; Performance</option>
                        <option value="Yoga & Wellness">Yoga &amp; Wellness</option>
                        <option value="Powerlifting">Powerlifting</option>
                      </select>
                    </div>
                    <div><div className="form-label">{t('country')}</div>
                      <select ref={trCountryRef} className="form-select">
                        <option value="SA">🇸🇦 Saudi Arabia</option><option value="AE">🇦🇪 UAE</option><option value="KW">🇰🇼 Kuwait</option>
                        <option value="QA">🇶🇦 Qatar</option><option value="BH">🇧🇭 Bahrain</option><option value="OM">🇴🇲 Oman</option>
                        <option value="JO">🇯🇴 Jordan</option><option value="EG">🇪🇬 Egypt</option><option value="LB">🇱🇧 Lebanon</option>
                      </select>
                    </div>
                    <div><div className="form-label">{t('instagram')}</div><input type="text" autoComplete="off" className="form-input" style={{ borderColor: '#252525' }} placeholder="@your.handle" /></div>
                    <div><div className="form-label">{t('passwordLabel')}</div><input ref={trPasswordRef} type="password" autoComplete="new-password" className="form-input" style={{ borderColor: '#252525' }} placeholder={t('passMin')} /></div>
                    <div className="modal-scroll-hint">↓</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="modal-btn-outline" onClick={() => setTrainerStepInAuth(1)}>{t('back')}</button>
                      <button className="modal-btn-blue" style={{ flex: 2 }} onClick={() => setTrainerStepInAuth(3)}>{t('next')}</button>
                    </div>
                  </>
                )}

                {trainerStepInAuth === 3 && (
                  <>
                    <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>Upload your ID for verification.</div>
                    {[
                      { key: 'ida', icon: '🪪', label: t('idDoc'), sub: t('idDocSub') },
                      { key: 'certa', icon: '🏅', label: t('certDoc'), sub: t('certDocSub') },
                    ].map(doc => (
                      <div key={doc.key} className={`doc-upload-row${idUploaded[doc.key] ? ' uploaded' : ''}`} onClick={() => simulateUpload(doc.key)}>
                        <div style={{ fontSize: 22 }}>{doc.icon}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700 }}>{doc.label}</div>
                          <div style={{ fontSize: 11, color: '#666' }}>{doc.sub}</div>
                        </div>
                        <div style={{ fontSize: 11, color: idUploaded[doc.key] ? '#4D9EFF' : '#666' }}>
                          {idUploaded[doc.key] ? t('uploaded') : t('uploadBtn')}
                        </div>
                      </div>
                    ))}
                    <div style={{ background: 'rgba(77,158,255,.07)', border: '1px solid rgba(77,158,255,.15)', borderRadius: 9, padding: '10px 13px', fontSize: 12, color: '#888', lineHeight: 1.6 }}>
                      {t('verifyNote')} <span style={{ color: '#4D9EFF', fontWeight: 700 }}>{t('verifyHours')}</span>. {lang === 'ar' ? 'ستتلقى بريداً إلكترونياً عند الموافقة.' : "You'll get an email once approved."}
                    </div>
                    {authError && (
                      <div style={{ fontSize: 12, color: '#FF4D4D', background: 'rgba(255,77,77,.08)', border: '1px solid rgba(255,77,77,.2)', borderRadius: 8, padding: '9px 12px' }}>
                        {authError}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="modal-btn-outline" onClick={() => setTrainerStepInAuth(2)}>{t('back')}</button>
                      <button className="modal-btn-blue" style={{ flex: 2, opacity: isPending ? 0.7 : 1 }} onClick={handleTrainerSignup} disabled={isPending}>
                        {isPending ? t('submitting') : t('submitApp')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* SUCCESS SUB */}
            {authPanel === 'success-sub' && (
              <div style={{ padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 52 }}>🎉</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{t('successSubTitle')}</div>
                <div style={{ fontSize: 14, color: '#888', lineHeight: 1.7, maxWidth: 320 }}>{t('successSubDesc')}</div>
                <button onClick={() => setAuthOpen(false)} style={{ padding: '12px 32px', background: 'var(--accent)', border: 'none', borderRadius: 100, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--sans)', color: '#000', marginTop: 8 }}>{t('findCoach')}</button>
              </div>
            )}

            {/* SUCCESS TRAINER */}
            {authPanel === 'success-trainer' && (
              <div style={{ padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: 52 }}>⏳</div>
                <div style={{ fontSize: 20, fontWeight: 800 }}>{t('successTrTitle')}</div>
                <div style={{ fontSize: 14, color: '#888', lineHeight: 1.7, maxWidth: 300 }}>{t('successTrDesc')}</div>
                <div style={{ padding: '8px 18px', background: 'rgba(77,158,255,.08)', border: '1px solid rgba(77,158,255,.25)', borderRadius: 100, fontSize: 12, color: '#4D9EFF', fontFamily: 'var(--mono)', fontWeight: 600 }}>
                  {t('underReview')}
                </div>
                <button onClick={() => { setAuthOpen(false); router.push('/auth/pending') }} style={{ padding: '12px 32px', background: '#4D9EFF', border: 'none', borderRadius: 100, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--sans)', color: '#fff', marginTop: 4 }}>
                  {t('gotIt')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TRAINER APPLICATION MODAL ── */}
      {trainerModal && (
        <div className="modal-overlay" onClick={e => handleOverlayClick(e, () => setTrainerModal(false))}>
          <div className="modal-box modal-box-lg">
            <div className="modal-header">
              <div>
                <div className="modal-title">{t('trApplyTitle')}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2, fontFamily: 'var(--mono)' }}>{t('trApplySubStep')} {trainerStep < 4 ? trainerStep : 3} of 3</div>
              </div>
              <button className="modal-close" onClick={() => setTrainerModal(false)}>×</button>
            </div>
            {/* Progress bar */}
            <div style={{ height: 3, background: '#222' }}>
              <div style={{ height: '100%', background: 'var(--accent)', width: `${trainerStep >= 4 ? 100 : Math.round((trainerStep / 3) * 100)}%`, transition: 'width .3s ease' }} />
            </div>

            {/* Step 1 */}
            {trainerStep === 1 && (
              <div className="modal-body">
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>{t('personalInfo')}</div>
                <div className="form-grid-2">
                  <div><div className="form-label">{t('firstName')}</div><input type="text" className="form-input" placeholder="Khalid" /></div>
                  <div><div className="form-label">{t('lastName')}</div><input type="text" className="form-input" placeholder="Sultan" /></div>
                </div>
                <div><div className="form-label">{t('emailLabel')}</div><input type="email" className="form-input" placeholder="your@email.com" /></div>
                <div><div className="form-label">{t('country')}</div>
                  <select className="form-select">
                    <option>🇸🇦 Saudi Arabia</option><option>🇦🇪 UAE</option><option>🇰🇼 Kuwait</option>
                    <option>🇶🇦 Qatar</option><option>🇧🇭 Bahrain</option><option>🇴🇲 Oman</option>
                    <option>🇯🇴 Jordan</option><option>🇪🇬 Egypt</option><option>🇱🇧 Lebanon</option>
                  </select>
                </div>
                <div><div className="form-label">{t('instagram')}</div><input type="text" className="form-input" placeholder="@your.handle" /></div>
                <button className="modal-btn-primary" onClick={() => setTrainerStep(2)}>{t('next')}</button>
              </div>
            )}

            {/* Step 2 */}
            {trainerStep === 2 && (
              <div className="modal-body">
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>{t('specialtyPlans')}</div>
                <div><div className="form-label">{t('specialty')}</div>
                  <select className="form-select">
                    <option>Bodybuilding &amp; Muscle Gain</option>
                    <option>Weight Loss &amp; Fat Burning</option>
                    <option>Nutrition &amp; Diet Coaching</option>
                    <option>Women's Fitness</option>
                    <option>CrossFit &amp; Performance</option>
                    <option>Yoga &amp; Wellness</option>
                    <option>Powerlifting</option>
                  </select>
                </div>
                <div>
                  <div className="form-label">{t('plansLabel')}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ background: '#181818', border: '1px solid #252525', borderRadius: 9, padding: 13, display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <input type="text" placeholder={t('planName')} style={{ width: '100%', background: 'transparent', border: 'none', color: '#f0f0f0', fontSize: 13, fontWeight: 700, outline: 'none', marginBottom: 6, fontFamily: 'var(--sans)' }} />
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: '#888' }}>AED</span>
                          <input type="number" placeholder="450" style={{ width: 60, background: '#111', border: '1px solid #333', borderRadius: 6, padding: '4px 8px', color: 'var(--accent)', fontSize: 13, fontFamily: 'var(--mono)', outline: 'none', textAlign: 'center' }} />
                          <span style={{ fontSize: 11, color: '#888' }}>·</span>
                          <input type="number" placeholder="64" style={{ width: 50, background: '#111', border: '1px solid #333', borderRadius: 6, padding: '4px 8px', color: '#f0f0f0', fontSize: 13, fontFamily: 'var(--mono)', outline: 'none', textAlign: 'center' }} />
                          <span style={{ fontSize: 11, color: '#888' }}>{t('planDays')}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ background: '#181818', border: '1px dashed #333', borderRadius: 9, padding: 11, textAlign: 'center', cursor: 'pointer', color: '#555', fontSize: 13 }}>{t('addPlan')}</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(200,240,75,.07)', border: '1px solid rgba(200,240,75,.15)', borderRadius: 9, padding: 13 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 6 }}>{t('commission')}</div>
                  <div style={{ fontSize: 11, color: '#888', lineHeight: 1.6 }}>{t('commissionDesc')}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="modal-btn-outline" onClick={() => setTrainerStep(1)}>{t('back')}</button>
                  <button className="modal-btn-primary" style={{ flex: 2 }} onClick={() => setTrainerStep(3)}>{t('next')}</button>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {trainerStep === 3 && (
              <div className="modal-body">
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>{t('verificationDocs')}</div>
                <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6 }}>{t('verificationDesc')}</div>
                {[
                  { key: 'id-tr', icon: '🪪', label: t('idDoc'), sub: t('idDocSub') },
                  { key: 'cert-tr', icon: '🏅', label: t('certDoc'), sub: t('certDocSub') },
                ].map(doc => (
                  <div key={doc.key} className={`doc-upload-row${idUploaded[doc.key] ? ' uploaded' : ''}`} onClick={() => simulateUpload(doc.key)}>
                    <div style={{ fontSize: 22 }}>{doc.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{doc.label}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{doc.sub}</div>
                    </div>
                    <div style={{ fontSize: 11, color: idUploaded[doc.key] ? '#4D9EFF' : '#888' }}>
                      {idUploaded[doc.key] ? t('uploaded') : t('uploadBtn')}
                    </div>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="modal-btn-outline" onClick={() => setTrainerStep(2)}>{t('back')}</button>
                  <Link href="/auth/signup/trainer" className="modal-btn-primary" style={{ flex: 2, textAlign: 'center', textDecoration: 'none', padding: 13, borderRadius: 10, fontSize: 14, fontWeight: 800, display: 'block', color: '#000' }}>
                    {t('submitApp')}
                  </Link>
                </div>
              </div>
            )}

            {/* Step 4 — success */}
            {trainerStep === 4 && (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
                <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>{t('trSuccess')}</div>
                <div style={{ fontSize: 14, color: '#888', lineHeight: 1.7, marginBottom: 24 }}>{t('trSuccessDesc')}</div>
                <button onClick={() => setTrainerModal(false)} style={{ padding: '12px 32px', background: 'var(--accent)', border: 'none', borderRadius: 100, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--sans)', color: '#000' }}>{t('gotIt')}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TOAST ── */}
      <div className={`lp-toast${toast.show ? ' show' : ''}`}>
        <span style={{ fontSize: 16 }}>{toast.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#f0f0f0' }}>{toast.text}</span>
      </div>
    </div>
  )
}
