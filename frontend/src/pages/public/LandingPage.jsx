import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, ShieldCheck, Wifi, Coffee, Award, Sparkles, CheckCircle2, 
  ArrowRight, UserCheck, Clock, Zap, Calendar, MapPin, Phone, Mail, 
  MessageCircle, Printer, ChevronDown, ChevronUp, Star, VolumeX, Lock, 
  Sun, Moon, Users, Check, Share2, Compass, HeartHandshake, X, Download
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const BUDDHA_QUOTES = [
  {
    quote: "Peace comes from within. Do not seek it without.",
    author: "Lord Buddha",
    context: "Cultivate unbroken internal silence while preparing for your life goals."
  },
  {
    quote: "The mind is everything. What you think, you become.",
    author: "Lord Buddha",
    context: "Dedicate every study hour with unwavering self-belief and diligence."
  },
  {
    quote: "It is better to conquer yourself than to win a thousand battles.",
    author: "Lord Buddha",
    context: "Mastering daily consistency is the single greatest virtue for competitive exams."
  },
  {
    quote: "No matter how hard the past is, you can always begin again.",
    author: "Lord Buddha",
    context: "Every study session at Buddha Library is a fresh opportunity to excel."
  }
];

const SHIFTS_DATA = [
  {
    id: 'morning',
    title: 'Morning Shift',
    timing: '6:00 AM – 2:00 PM',
    duration: '8 Hours',
    capacity: 40,
    occupied: 28,
    badge: 'Fresh Mind Slot',
    icon: Sun,
    description: 'Crisp morning silence ideal for heavy theory, memory retention, and mock test solving before afternoon fatigue sets in.',
    idealFor: 'UPSC Aspirants, College Students, Early Morning Risers'
  },
  {
    id: 'evening',
    title: 'Evening Shift',
    timing: '2:00 PM – 10:00 PM',
    duration: '8 Hours',
    capacity: 40,
    occupied: 33,
    badge: 'High Energy Zone',
    icon: Moon,
    description: 'Dedicated post-lunch and evening slot with optimal air conditioning and high-speed Wi-Fi for video lectures and revision.',
    idealFor: 'Working Professionals, College Attendees, CA & CS Aspirants'
  },
  {
    id: 'fullday',
    title: 'Full Day Shift',
    timing: '6:00 AM – 10:00 PM',
    duration: '16 Hours',
    capacity: 50,
    occupied: 44,
    badge: 'Aspirants First Choice',
    icon: Zap,
    description: 'Continuous, uninterrupted desk reservation from dawn till night with dedicated personal locker and power plug.',
    idealFor: 'Full-Time UPSC, NEET-PG, JEE & GATE Repeaters'
  },
  {
    id: 'vip247',
    title: '24/7 Unlimited VIP Pass',
    timing: 'Round the Clock (24 Hours)',
    duration: '24 Hours',
    capacity: 20,
    occupied: 18,
    badge: 'Few Seats Left',
    icon: Sparkles,
    description: 'Round-the-clock unrestricted biometric & QR access. Study anytime, night or day, with quiet cabin privileges.',
    idealFor: 'Night Owls, Medical Residents, Marathon Aspirants'
  }
];

const SERVICES_DATA = [
  {
    id: 1,
    title: 'Pin-Drop Silent Acoustic Halls',
    category: 'study_zones',
    icon: VolumeX,
    tag: 'Acoustic Soundproofing',
    description: 'Architecturally engineered sound-absorbent acoustic paneling with a strict zero-noise policy, ensuring 100% distraction-free deep work.'
  },
  {
    id: 2,
    title: 'Dedicated Desks & Personal Lockers',
    category: 'comfort',
    icon: Lock,
    tag: 'Ergonomic Workstations',
    description: 'Wide laminated study desks with premium orthopaedic mesh armchairs, personal metallic key lockers, and multi-pin international charging points.'
  },
  {
    id: 3,
    title: 'Dual-ISP Gigabit Optical Fiber Wi-Fi',
    category: 'technology',
    icon: Wifi,
    tag: '1 Gbps Ultra-Speed',
    description: 'Carrier-grade redundant optical fiber connection with dual ISP automatic failover. Zero buffer for live classes, test series, and high-res video streaming.'
  },
  {
    id: 4,
    title: 'Competitive Exam Library & Press Hub',
    category: 'study_zones',
    icon: BookOpen,
    tag: 'Daily Newspapers & Periodicals',
    description: 'Daily national newspapers (The Hindu, Indian Express, Mint) and monthly competitive periodicals (Yojana, Kurukshetra, Pratiyogita Darpan).'
  },
  {
    id: 5,
    title: 'Zen Meditation & Mindfulness Corner',
    category: 'comfort',
    icon: Sparkles,
    tag: 'Buddha Mindfulness',
    description: 'A serene mindfulness area inspired by Lord Buddha’s teachings to help aspirants practice 10-minute deep breathing to dissolve stress and anxiety.'
  },
  {
    id: 6,
    title: 'Soundproof Discussion & Mock Room',
    category: 'study_zones',
    icon: Users,
    tag: 'Group Study & Interviews',
    description: 'Isolated soundproof chamber equipped with whiteboards and collaborative seating for peer discussions, group studies, and mock interview rounds.'
  },
  {
    id: 7,
    title: 'Hygienic Cafeteria & RO Alkaline Pantry',
    category: 'comfort',
    icon: Coffee,
    tag: 'Complimentary Hot Beverages',
    description: 'Multi-stage RO purified hot/cold alkaline water, microwave oven for home-packed meals, refrigerator, and complimentary tea & coffee station.'
  },
  {
    id: 8,
    title: '24/7 CCTV & Biometric / QR Access',
    category: 'security',
    icon: ShieldCheck,
    tag: '360° Safety & Surveillance',
    description: 'High-definition CCTV coverage across all corridors, contact-less digital QR attendance, emergency alert bells, and female-friendly safe premises.'
  },
  {
    id: 9,
    title: '100% Uninterrupted Power Backup',
    category: 'technology',
    icon: Zap,
    tag: 'Zero-Second Switchover',
    description: 'Heavy-duty industrial generator coupled with pure sine-wave online UPS ensures lights, air conditioning, and internet never drop even for a second.'
  },
  {
    id: 10,
    title: 'Laser Printing, Scanning & Binding Desk',
    category: 'technology',
    icon: Printer,
    tag: 'Subsidized Student Rate',
    description: 'On-site high-speed double-sided laser printing, color scanning, notes photocopying, and spiral document binding at minimal student prices.'
  }
];

const PRICING_PLANS = [
  {
    id: 'flexi',
    name: 'Flexi Study Desk',
    shift: 'Any 8-Hour Shift',
    baseMonthly: 700,
    registrationFee: 500,
    popular: false,
    description: 'Flexible seat in silent study hall with all essential amenities',
    features: [
      'Access to any 8-hour shift',
      'Comfortable study chair & clean desk',
      'Gigabit high-speed Wi-Fi access',
      'RO Alkaline purified drinking water',
      'Daily newspapers & magazines',
      'Multi-session attendance tracking'
    ]
  },
  {
    id: 'dedicated',
    name: 'Dedicated Reserved Desk',
    shift: 'Full Day (6 AM - 10 PM)',
    baseMonthly: 1000,
    registrationFee: 500,
    popular: true,
    description: 'Your own fixed seat with personal locker and power socket',
    features: [
      'Permanent fixed desk (never reshuffled)',
      'Dedicated personal key locker',
      'High-back ergonomic mesh armchair',
      'Dedicated desk 3-pin power socket',
      'Full Day 16-hour access',
      'Complimentary morning & evening tea',
      'Digital student ID membership pass'
    ]
  },
  {
    id: 'vip_cabin',
    name: 'Air-Conditioned VIP Cabin',
    shift: '16 Hours Silent Cabin',
    baseMonthly: 1400,
    registrationFee: 1000,
    popular: false,
    description: 'Private partitioned cabin with superior acoustic insulation',
    features: [
      'Private acoustic partitioned booth',
      'Adjustable soft LED desk lamp',
      'Double storage locker + bookshelf',
      'Chilled silent AC climate control',
      'Priority access to discussion room',
      'Subsidized 50 free printouts / month',
      'All refreshments and hot beverages'
    ]
  },
  {
    id: 'unlimited247',
    name: '24/7 Unlimited VIP Pass',
    shift: 'Round-the-Clock Access',
    baseMonthly: 1800,
    registrationFee: 1000,
    popular: false,
    description: 'Complete 24-hour unrestricted access for marathon preparation',
    features: [
      '24/7 unrestricted biometric/QR entry',
      'Permanent reserved study cabin',
      'Overnight silent hall privileges',
      'Unlimited pantry & hot beverages',
      'Free high-speed document printing',
      'Dedicated locker + resting lounge access',
      'VIP concierge support'
    ]
  }
];

const FAQS = [
  {
    q: 'Can I take a 1-day free trial before taking a membership?',
    a: 'Absolutely! Buddha Library welcomes serious aspirants for a complimentary 1-day trial pass. You can book it instantly using the online form on this page or visit our front desk reception.'
  },
  {
    q: 'What are the operating hours of Buddha Library?',
    a: 'We are open 24 Hours a day, 7 days a week, 365 days a year including national holidays. Our shifts cover Morning (6 AM - 2 PM), Evening (2 PM - 10 PM), Full Day (6 AM - 10 PM), and 24/7 Unlimited.'
  },
  {
    q: 'How does the Dedicated Reserved Seat work?',
    a: 'With a Dedicated Desk, that specific seat number is exclusively assigned to you. You can leave your study books and materials safely in your personal key locker without worrying about someone else occupying it.'
  },
  {
    q: 'Is there a stable internet connection for online lectures and tests?',
    a: 'Yes, we have high-speed commercial optical fiber connections from two separate telecom service providers with automatic failover, providing speeds up to 1 Gbps with low latency.'
  },
  {
    q: 'What are the security measures for female students and late-night study?',
    a: 'Safety is our highest priority under Flair Foundation. The entire premises are monitored by 24/7 high-definition CCTV cameras, security personnel, biometric/QR check-in, and well-illuminated surroundings near the main metro road.'
  },
  {
    q: 'What payment modes are accepted for fees?',
    a: 'We accept UPI (Google Pay, PhonePe, Paytm), Net Banking, Debit/Credit Cards, and Cash at the front desk. An instant official digitally verified receipt with a unique receipt number is generated for every payment.'
  }
];

const LandingPage = () => {
  // Billing cycle state: 'monthly', 'quarterly' (5% off), 'half_yearly' (10% off), 'annual' (15% off)
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedShift, setSelectedShift] = useState('fullday');
  const [currentQuoteIdx, setCurrentQuoteIdx] = useState(0);
  const [openFaqIdx, setOpenFaqIdx] = useState(null);
  const [serviceFilter, setServiceFilter] = useState('all');

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    fullName: '',
    mobile: '',
    email: '',
    examTarget: 'UPSC Civil Services',
    preferredShift: 'Full Day Shift (6 AM - 10 PM)',
    deskType: 'Dedicated Reserved Desk',
    visitDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [generatedPass, setGeneratedPass] = useState(null);
  const [passModalOpen, setPassModalOpen] = useState(false);

  // Quote Rotator
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentQuoteIdx((prev) => (prev + 1) % BUDDHA_QUOTES.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  // Calculate pricing based on cycle
  const getCycleMultiplier = () => {
    switch (billingCycle) {
      case 'quarterly': return { months: 3, discountRate: 0.05, label: '3 Months (5% OFF)' };
      case 'half_yearly': return { months: 6, discountRate: 0.10, label: '6 Months (10% OFF)' };
      case 'annual': return { months: 12, discountRate: 0.15, label: '1 Year (15% OFF)' };
      default: return { months: 1, discountRate: 0.0, label: '1 Month' };
    }
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (!bookingForm.fullName || !bookingForm.mobile) {
      alert('Please provide your name and mobile number.');
      return;
    }

    setBookingSubmitting(true);

    setTimeout(() => {
      const passId = `BL-PASS-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      const newPass = {
        passId,
        fullName: bookingForm.fullName,
        mobile: bookingForm.mobile,
        email: bookingForm.email || 'N/A',
        examTarget: bookingForm.examTarget,
        preferredShift: bookingForm.preferredShift,
        deskType: bookingForm.deskType,
        visitDate: bookingForm.visitDate,
        issuedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      };

      // Save to localStorage
      try {
        const pastBookings = JSON.parse(localStorage.getItem('buddha_library_passes') || '[]');
        pastBookings.unshift(newPass);
        localStorage.setItem('buddha_library_passes', JSON.stringify(pastBookings));
      } catch (err) {
        console.error('Failed to save to local storage', err);
      }

      setGeneratedPass(newPass);
      setBookingSubmitting(false);
      setPassModalOpen(true);
    }, 600);
  };

  const getWhatsAppBookingLink = (pass) => {
    const text = encodeURIComponent(
      `Hello Buddha Library (Flair Foundation),\nI have generated a Study Pass / Seat Enquiry:\n\n` +
      `*Pass ID:* ${pass.passId}\n` +
      `*Name:* ${pass.fullName}\n` +
      `*Mobile:* ${pass.mobile}\n` +
      `*Exam Target:* ${pass.examTarget}\n` +
      `*Preferred Shift:* ${pass.preferredShift}\n` +
      `*Desk Preference:* ${pass.deskType}\n` +
      `*Visit Date:* ${pass.visitDate}\n\n` +
      `Kindly confirm seat availability for my visit. Thank you!`
    );
    return `https://wa.me/919876543210?text=${text}`;
  };

  const filteredServices = serviceFilter === 'all' 
    ? SERVICES_DATA 
    : SERVICES_DATA.filter(s => s.category === serviceFilter);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 font-semibold text-xs py-1.5 px-4 text-center tracking-wide flex items-center justify-center space-x-2">
        <Sparkles className="h-3.5 w-3.5" />
        <span>Admission Open for 2026 Batch • A Unit of Flair Foundation • Free 1-Day Trial Passes Available Now!</span>
        <a href="#trial-pass" className="underline font-bold hover:text-slate-900 ml-1">Claim Your Pass &rarr;</a>
      </div>

      {/* Main Navigation Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center space-x-3.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-md group-hover:blur-lg transition-all"></div>
              <img 
                src="/buddha-logo.png" 
                alt="Buddha Library Logo" 
                className="h-12 w-12 sm:h-14 sm:w-14 object-contain rounded-full relative z-10 ring-2 ring-amber-400/40 shadow-lg group-hover:scale-105 transition-transform" 
              />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl sm:text-2xl text-white tracking-tight leading-none group-hover:text-amber-300 transition-colors">
                  Buddha <span className="text-amber-400">Library</span>
                </span>
                <span className="hidden md:inline-block px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 font-serif italic">
                  बुद्धम शरणम् गच्छामि।
                </span>
              </div>
              <span className="text-xs text-slate-400 font-medium tracking-wide">
                A Unit of <strong className="text-amber-400/90 font-semibold">Flair Foundation</strong>
              </span>
            </div>
          </Link>

          {/* Desktop Nav Menu Links */}
          <nav className="hidden lg:flex items-center space-x-6 text-sm font-medium text-slate-300">
            <a href="#services" className="hover:text-amber-400 transition-colors">Amenities</a>
            <a href="#shifts" className="hover:text-amber-400 transition-colors">Shifts & Seats</a>
            <a href="#pricing" className="hover:text-amber-400 transition-colors">Plans & Fees</a>
            <a href="#trial-pass" className="hover:text-amber-400 transition-colors">Free Day Pass</a>
            <a href="#mindfulness" className="hover:text-amber-400 transition-colors">Mindful Hub</a>
            <a href="#faqs" className="hover:text-amber-400 transition-colors">FAQs</a>
            <a href="#contact" className="hover:text-amber-400 transition-colors">Contact</a>
          </nav>

          {/* Right Action CTAs */}
          <div className="flex items-center space-x-3">
            <a
              href="#trial-pass"
              className="hidden sm:inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Free Day Pass</span>
            </a>

            <Link
              to="/login"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all hover:scale-102"
            >
              <UserCheck className="h-4 w-4" />
              <span>Portal Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 overflow-hidden border-b border-slate-800/80">
        {/* Background Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-slate-900/0 to-transparent pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            
            {/* Left Hero Content */}
            <div className="flex-1 text-center lg:text-left space-y-6">
              
              {/* Unit Tag & Spiritual Motto */}
              <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>A Unit of Flair Foundation</span>
                </div>
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300 text-xs font-serif italic">
                  <span>बुद्धम शरणम् गच्छामि।</span>
                </div>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
                Enlightened Focus. <br className="hidden sm:inline" />
                Unbroken Silence. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
                  Your Path to Success.
                </span>
              </h1>

              {/* Sub-Headline */}
              <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Welcome to <strong className="text-white">Buddha Library</strong> — a premier study sanctuary built for serious aspirants of 
                <span className="text-amber-300 font-medium"> UPSC, NEET, JEE, CA, GATE & State PCS</span>. Experience acoustic soundproofing, 
                high-speed gigabit Wi-Fi, ergonomic reserved desks, and a peaceful mindfulness environment inspired by the wisdom of Lord Buddha.
              </p>

              {/* Live Status Pill */}
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-inner">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Open 24/7 • High-Speed Fiber Active • Generator Backup Live</span>
              </div>

              {/* CTA Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <a
                  href="#trial-pass"
                  className="inline-flex items-center space-x-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-base shadow-xl shadow-amber-500/25 transition-all hover:scale-105"
                >
                  <Sparkles className="h-5 w-5" />
                  <span>Book Free 1-Day Trial Pass</span>
                  <ArrowRight className="h-4 w-4" />
                </a>

                <a
                  href="#shifts"
                  className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-base border border-slate-700 transition-all hover:border-amber-400/50"
                >
                  <Clock className="h-4 w-4 text-amber-400" />
                  <span>Check Live Seats</span>
                </a>
              </div>

              {/* Rotating Quote Banner */}
              <div className="mt-8 p-4 rounded-2xl bg-slate-900/80 border border-amber-500/20 max-w-xl mx-auto lg:mx-0 shadow-lg">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0 mt-0.5">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 text-left">
                    <p className="text-xs font-serif italic text-amber-200">
                      "{BUDDHA_QUOTES[currentQuoteIdx].quote}"
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      — {BUDDHA_QUOTES[currentQuoteIdx].author} • <span className="text-slate-500">{BUDDHA_QUOTES[currentQuoteIdx].context}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Hero Logo & Visual Emblem */}
            <div className="flex-1 flex flex-col items-center justify-center relative">
              <div className="relative w-72 h-72 sm:w-96 sm:h-96 flex items-center justify-center">
                {/* Radiant Concentric Rings */}
                <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-2xl animate-pulse"></div>
                <div className="absolute inset-4 rounded-full border border-amber-500/20 animate-spin" style={{ animationDuration: '30s' }}></div>
                <div className="absolute inset-10 rounded-full border border-dashed border-amber-400/20"></div>

                {/* Central Emblem */}
                <img 
                  src="/buddha-logo.png" 
                  alt="Buddha Library Emblem" 
                  className="w-64 h-64 sm:w-80 sm:h-80 object-contain rounded-full shadow-2xl relative z-10 ring-4 ring-amber-400/40 transform hover:rotate-1 hover:scale-105 transition-all duration-300"
                />
              </div>

              {/* Trust Badge Below Emblem */}
              <div className="mt-6 flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 shadow-md">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Certified Study Environment by <strong>Flair Foundation</strong></span>
              </div>
            </div>

          </div>

          {/* Quick Metrics KPI Strip */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">150+</p>
              <p className="text-xs text-slate-400 font-medium">Ergonomic Desks</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-white font-mono">1 Gbps</p>
              <p className="text-xs text-slate-400 font-medium">Dual Optical Fiber</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">99.8%</p>
              <p className="text-xs text-slate-400 font-medium">Silence Score</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
              <p className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">1,200+</p>
              <p className="text-xs text-slate-400 font-medium">Enrolled Aspirants</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1 col-span-2 md:col-span-1">
              <p className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono">100%</p>
              <p className="text-xs text-slate-400 font-medium">Power Backup 24/7</p>
            </div>
          </div>

        </div>
      </section>

      {/* Interactive Shift & Live Seat Availability Section */}
      <section id="shifts" className="py-20 bg-slate-900/40 border-b border-slate-800/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5" />
              <span>Real-Time Desk Availability</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Study Shifts & Live Seat Status</h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Select your preferred study slot. We strictly cap seats per shift to guarantee undisturbed peace and ergonomic comfort.
            </p>
          </div>

          {/* Shift Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SHIFTS_DATA.map((shift) => {
              const IconComponent = shift.icon;
              const remaining = shift.capacity - shift.occupied;
              const percentOccupied = Math.round((shift.occupied / shift.capacity) * 100);
              const isSelected = selectedShift === shift.id;

              return (
                <div
                  key={shift.id}
                  onClick={() => {
                    setSelectedShift(shift.id);
                    setBookingForm(prev => ({ ...prev, preferredShift: `${shift.title} (${shift.timing})` }));
                  }}
                  className={`p-6 rounded-2xl bg-slate-900 border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-4 relative ${
                    isSelected 
                      ? 'border-amber-400 shadow-xl shadow-amber-500/15 bg-slate-850' 
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top Badge */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {shift.badge}
                    </span>
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400'}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Title & Timing */}
                  <div>
                    <h3 className="text-xl font-bold text-white">{shift.title}</h3>
                    <p className="text-xs font-mono font-bold text-amber-400 mt-1">{shift.timing}</p>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3">{shift.description}</p>
                  </div>

                  {/* Occupancy Progress Bar */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-400">Occupancy:</span>
                      <span className={remaining <= 5 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {remaining} seats left
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${remaining <= 5 ? 'bg-rose-500' : 'bg-amber-400'}`}
                        style={{ width: `${percentOccupied}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] text-slate-500 text-right">{shift.occupied} / {shift.capacity} reserved</p>
                  </div>

                  {/* Recommended Audience */}
                  <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                    <strong className="text-slate-300 block">Best for:</strong>
                    <span>{shift.idealFor}</span>
                  </div>

                  {/* Select Action Button */}
                  <button
                    type="button"
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-1.5 ${
                      isSelected 
                        ? 'bg-amber-500 text-slate-950 shadow-md' 
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    {isSelected ? <Check className="h-4 w-4" /> : null}
                    <span>{isSelected ? 'Shift Selected' : 'Choose This Shift'}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Quick Notice */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center text-xs text-amber-200 flex items-center justify-center space-x-2">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Students can shift between slots based on vacancy with front-desk reception approval without extra fees.</span>
          </div>

        </div>
      </section>

      {/* Comprehensive World-Class Amenities & Services */}
      <section id="services" className="py-20 border-b border-slate-800/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Award className="h-3.5 w-3.5" />
              <span>World-Class Infrastructure</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Services & Study Facilities</h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Engineered from the ground up by Flair Foundation to eliminate every possible distraction from your competitive preparation.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { id: 'all', label: 'All Services (10)' },
              { id: 'study_zones', label: 'Silent Zones & Desks' },
              { id: 'technology', label: 'High-Tech & Power' },
              { id: 'comfort', label: 'Wellness & Amenities' },
              { id: 'security', label: 'Security & Campus' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setServiceFilter(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  serviceFilter === cat.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Services Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map(service => {
              const ServiceIcon = service.icon;
              return (
                <div 
                  key={service.id} 
                  className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition-all hover:-translate-y-1 space-y-4 flex flex-col justify-between group shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-12 w-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition-all">
                        <ServiceIcon className="h-6 w-6" />
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {service.tag}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                      {service.title}
                    </h3>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {service.description}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center text-[11px] font-bold text-amber-400/80 group-hover:text-amber-400">
                    <span>Included in All Full Memberships</span>
                    <CheckCircle2 className="h-3.5 w-3.5 ml-1.5 text-emerald-400" />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Interactive Fee Calculator & Pricing Plans */}
      <section id="pricing" className="py-20 bg-slate-900/50 border-b border-slate-800/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5" />
              <span>Transparent & Subsidized Fees</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Membership Plans & Fee Calculator</h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Choose your tenure to unlock instant institutional discounts backed by Flair Foundation's education fund.
            </p>

            {/* Tenure Selector Switcher */}
            <div className="inline-flex p-1.5 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner mt-4">
              {[
                { id: 'monthly', label: 'Monthly' },
                { id: 'quarterly', label: 'Quarterly', discount: '5% OFF' },
                { id: 'half_yearly', label: 'Half-Yearly', discount: '10% OFF' },
                { id: 'annual', label: 'Annual', discount: '15% OFF' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setBillingCycle(tab.id)}
                  className={`px-3 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    billingCycle === tab.id
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.discount && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${billingCycle === tab.id ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {tab.discount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRICING_PLANS.map(plan => {
              const cycleInfo = getCycleMultiplier();
              const grossFee = plan.baseMonthly * cycleInfo.months;
              const netFee = Math.round(grossFee * (1 - cycleInfo.discountRate));
              const effectiveMonthly = Math.round(netFee / cycleInfo.months);
              const savings = grossFee - netFee;

              return (
                <div
                  key={plan.id}
                  className={`p-6 sm:p-7 rounded-2xl bg-slate-900 flex flex-col justify-between space-y-6 relative transition-all duration-200 shadow-xl ${
                    plan.popular
                      ? 'border-2 border-amber-400 shadow-amber-500/10 scale-102 z-10'
                      : 'border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[11px] font-black uppercase tracking-wider shadow-md">
                      Most Popular Aspirant Choice
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                      <p className="text-xs text-amber-400 font-medium mt-0.5">{plan.shift}</p>
                      <p className="text-xs text-slate-400 mt-2">{plan.description}</p>
                    </div>

                    {/* Price Tag */}
                    <div className="pt-2 border-t border-slate-800">
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-3xl sm:text-4xl font-black text-white font-mono">₹{netFee.toLocaleString()}</span>
                        <span className="text-xs text-slate-400">/ {cycleInfo.label}</span>
                      </div>

                      {cycleInfo.months > 1 && (
                        <div className="mt-1 flex items-center space-x-2 text-xs">
                          <span className="line-through text-slate-500 font-mono">₹{grossFee.toLocaleString()}</span>
                          <span className="text-emerald-400 font-bold">Save ₹{savings.toLocaleString()}</span>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-500 mt-1">
                        Effective: <strong>₹{effectiveMonthly}/month</strong> • ₹{plan.registrationFee} one-time admission
                      </p>
                    </div>

                    {/* Included Features List */}
                    <ul className="space-y-2.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Plan CTA */}
                  <a
                    href="#trial-pass"
                    onClick={() => {
                      setBookingForm(prev => ({
                        ...prev,
                        deskType: plan.name,
                        notes: `Enquiring for ${plan.name} with ${cycleInfo.label} tenure.`
                      }));
                    }}
                    className={`w-full py-3 rounded-xl font-bold text-center text-xs transition-all flex items-center justify-center space-x-1.5 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    <span>Reserve {plan.name}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Free 1-Day Trial Pass & Online Seat Reservation (Functional Form) */}
      <section id="trial-pass" className="py-20 relative scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Instant Confirmation Pass</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Book Free 1-Day Trial Pass / Seat Reservation</h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
              Experience the peaceful ambiance of Buddha Library firsthand before deciding. No credit card or advance payment required.
            </p>
          </div>

          {/* Form Container */}
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative">
            <div className="absolute top-0 right-8 -translate-y-1/2 px-4 py-1 rounded-full bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md">
              100% Free Trial Pass
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={bookingForm.fullName}
                    onChange={(e) => setBookingForm({ ...bookingForm, fullName: e.target.value })}
                    placeholder="e.g. Priyanshu Sharma"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    WhatsApp / Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={bookingForm.mobile}
                    onChange={(e) => setBookingForm({ ...bookingForm, mobile: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={bookingForm.email}
                    onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                    placeholder="e.g. student@example.com"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Target Exam / Goal
                  </label>
                  <select
                    value={bookingForm.examTarget}
                    onChange={(e) => setBookingForm({ ...bookingForm, examTarget: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    <option value="UPSC Civil Services">UPSC Civil Services (IAS / IPS)</option>
                    <option value="NEET UG / PG Medical">NEET UG / PG Medical</option>
                    <option value="JEE Advanced / Mains">JEE Advanced / Mains</option>
                    <option value="CA Final / Inter">CA Final / Intermediate</option>
                    <option value="GATE / Engineering">GATE / ESE Engineering</option>
                    <option value="SSC CGL / Banking">SSC CGL / Banking / Railways</option>
                    <option value="State PCS">State PCS (UPPSC, BPSC, RAS)</option>
                    <option value="College / University Degree">College / University Degree</option>
                    <option value="Other Self-Study">Other Self-Study</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Preferred Shift
                  </label>
                  <select
                    value={bookingForm.preferredShift}
                    onChange={(e) => setBookingForm({ ...bookingForm, preferredShift: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    <option value="Morning Shift (6 AM - 2 PM)">Morning Shift (6 AM - 2 PM)</option>
                    <option value="Evening Shift (2 PM - 10 PM)">Evening Shift (2 PM - 10 PM)</option>
                    <option value="Full Day Shift (6 AM - 10 PM)">Full Day Shift (6 AM - 10 PM)</option>
                    <option value="24/7 Unlimited VIP">24/7 Unlimited VIP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Preferred Desk Type
                  </label>
                  <select
                    value={bookingForm.deskType}
                    onChange={(e) => setBookingForm({ ...bookingForm, deskType: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    <option value="Flexi Study Desk">Flexi Study Desk</option>
                    <option value="Dedicated Reserved Desk">Dedicated Reserved Desk</option>
                    <option value="Air-Conditioned VIP Cabin">Air-Conditioned VIP Cabin</option>
                    <option value="24/7 VIP Pass">24/7 VIP Pass</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Planned Visit Date
                  </label>
                  <input
                    type="date"
                    value={bookingForm.visitDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, visitDate: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-amber-400 transition-colors font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Special Notes / Any Requirement
                </label>
                <textarea
                  rows={2}
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  placeholder="e.g. Need seat near power socket for laptop, preparing for prelims..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={bookingSubmitting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-base shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center space-x-2"
              >
                {bookingSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-950 border-t-transparent"></div>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>Generate Instant Digital Trial Pass</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* Generated Digital Pass Modal */}
      {passModalOpen && generatedPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-400/50 rounded-3xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header Bar */}
            <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 p-5 text-center text-slate-950 relative">
              <button
                onClick={() => setPassModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-950/20 hover:bg-slate-950/40 text-slate-950 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex items-center justify-center space-x-2.5 mb-1">
                <img src="/buddha-logo.png" alt="Buddha Library" className="h-10 w-10 object-contain rounded-full shadow-md ring-2 ring-white/60 bg-white" />
                <h3 className="text-xl font-black tracking-tight uppercase">Buddha Library</h3>
              </div>
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">A Unit of Flair Foundation</p>
              <p className="text-[11px] font-serif italic text-amber-950">बुद्धम शरणम् गच्छामि। • Digital 1-Day Trial Pass</p>
            </div>

            {/* Pass Body Content */}
            <div className="p-6 sm:p-8 space-y-6 text-slate-100">
              
              {/* Pass ID Banner */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-amber-500/30">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Pass Reference ID</span>
                  <span className="font-mono text-base font-black text-amber-400">{generatedPass.passId}</span>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase">
                  Confirmed
                </span>
              </div>

              {/* Aspirant & Pass Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Aspirant Name</span>
                  <span className="font-bold text-white text-sm">{generatedPass.fullName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Mobile</span>
                  <span className="font-mono text-slate-200">{generatedPass.mobile}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Exam Target</span>
                  <span className="font-medium text-amber-300">{generatedPass.examTarget}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Desk Preference</span>
                  <span className="font-medium text-slate-200">{generatedPass.deskType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Assigned Shift</span>
                  <span className="font-medium text-slate-200">{generatedPass.preferredShift}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Visit Date</span>
                  <span className="font-mono text-amber-400 font-bold">{generatedPass.visitDate}</span>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white text-slate-950 text-center space-y-2">
                <QRCodeSVG value={generatedPass.passId} size={110} level="H" />
                <p className="text-[11px] font-bold text-slate-700">Present this QR at Reception for Free Desk Allotment</p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <a
                  href={getWhatsAppBookingLink(generatedPass)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center space-x-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Send Pass to Buddha Library on WhatsApp</span>
                </a>

                <div className="flex space-x-3">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Pass</span>
                  </button>

                  <button
                    onClick={() => setPassModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-[10px] text-slate-500">
              Buddha Library • A Unit of Flair Foundation • Valid for 1 Day Trial
            </div>
          </div>
        </div>
      )}

      {/* Aspirants Mindfulness & Wisdom Hub */}
      <section id="mindfulness" className="py-20 bg-slate-900/30 border-b border-slate-800/80 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Compass className="h-3.5 w-3.5" />
              <span>Inner Calm & Cognitive Stamina</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Mindful Study & Concentration Sanctuary</h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Inspired by Lord Buddha’s principles of mindfulness (Sati) and mental discipline, we cultivate a culture that balances intense preparation with mental calmness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <VolumeX className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">The Golden Silence Rule</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Mobile phones on absolute silent, whisper-free study zones, and dedicated conversation zones ensure your train of thought is never interrupted.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">50-10 Pomodoro Rhythm</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Study with laser intensity for 50 minutes, then take a 10-minute mindful breathing or hydration break to prevent cognitive burnout and fatigue.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Peer Synergy & Mentorship</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Surround yourself with hundreds of like-minded, disciplined candidates striving for the nation’s highest competitive positions.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Aspirants Success Stories & Testimonials */}
      <section className="py-20 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Star className="h-3.5 w-3.5" />
              <span>Verified Aspirant Feedback</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Student Experiences at Buddha Library</h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Read how serious competitive candidates transformed their study discipline under Flair Foundation’s study ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center space-x-1 text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400" />)}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "The silence discipline at Buddha Library is unmatched. Having my own dedicated desk with a locker meant I never wasted 20 minutes looking for a seat. Cleared UPSC CSE Prelims with peace of mind!"
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center space-x-3">
                <div className="h-9 w-9 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs">
                  RS
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Rahul Sharma</h4>
                  <p className="text-[10px] text-slate-400">UPSC Civil Services Aspirant</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center space-x-1 text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400" />)}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "Super-fast Wi-Fi and 100% power backup made watching Marrow and Prepladder video lectures completely smooth. The 24/7 shift helped during marathon revision rounds before NEET-PG."
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center space-x-3">
                <div className="h-9 w-9 rounded-full bg-emerald-500 text-slate-950 font-black flex items-center justify-center text-xs">
                  AV
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Dr. Ananya Verma</h4>
                  <p className="text-[10px] text-slate-400">NEET PG Aspirant (Rank Holder)</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center space-x-1 text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400" />)}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                "The management under Flair Foundation is so helpful. The digital QR attendance and clean pantry with hot tea kept me going during my 14-hour daily CA Final study schedules."
              </p>
              <div className="pt-2 border-t border-slate-800 flex items-center space-x-3">
                <div className="h-9 w-9 rounded-full bg-cyan-500 text-slate-950 font-black flex items-center justify-center text-xs">
                  VS
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Vikram Singh</h4>
                  <p className="text-[10px] text-slate-400">CA Final Qualified</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Frequently Asked Questions Accordion */}
      <section id="faqs" className="py-20 bg-slate-900/30 border-b border-slate-800/80 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Frequently Asked Questions</h2>
            <p className="text-slate-400 text-sm">Clear, transparent answers regarding admissions, lockers, and center rules.</p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between font-bold text-sm text-white hover:text-amber-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="h-5 w-5 text-amber-400 shrink-0" /> : <ChevronDown className="h-5 w-5 text-slate-500 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Contact, Location & Foundation Details */}
      <section id="contact" className="py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <MapPin className="h-3.5 w-3.5" />
              <span>Campus & Connectivity</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Visit Buddha Library</h2>
            <p className="text-slate-400 text-sm">
              Centrally located with direct metro walking connectivity, ample parking, and peaceful surroundings.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Contact Cards */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <MapPin className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Center Location</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Buddha Library, Flair Foundation Knowledge Complex,<br />
                Opposite Metro Pillar 142, Main Institutional Road,<br />
                New Delhi - 110005
              </p>
              <p className="text-[11px] text-amber-400 font-medium">Just 2 minutes walk from Metro Station</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Phone className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Helpline & WhatsApp</h3>
              <p className="text-xs text-slate-300">
                Front Desk: <strong>+91 98765 43210</strong><br />
                Admissions: <strong>+91 91234 56789</strong>
              </p>
              <a 
                href="https://wa.me/919876543210" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center space-x-1.5 text-xs text-emerald-400 font-bold hover:underline"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Chat on WhatsApp Directly</span>
              </a>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-white">Operational Hours</h3>
              <p className="text-xs text-slate-300">
                Study Halls: <strong>Open 24 Hours (All 365 Days)</strong><br />
                Reception & Enquiries: <strong>8:00 AM – 9:00 PM</strong>
              </p>
              <p className="text-[11px] text-slate-500">Parent Organization: Flair Foundation</p>
            </div>

          </div>

        </div>
      </section>

      {/* Main Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-3">
              <img src="/buddha-logo.png" alt="Buddha Library" className="h-10 w-10 object-contain rounded-full shadow-md ring-1 ring-amber-400/40" />
              <div>
                <p className="text-sm font-bold text-white">Buddha Library</p>
                <p className="text-[11px] text-amber-400 font-medium">A Unit of Flair Foundation</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <a href="#services" className="hover:text-amber-400">Services</a>
              <a href="#shifts" className="hover:text-amber-400">Shifts</a>
              <a href="#pricing" className="hover:text-amber-400">Plans</a>
              <a href="#trial-pass" className="hover:text-amber-400">Free Trial Pass</a>
              <Link to="/login" className="hover:text-amber-400 font-bold text-white">Staff / Student Login</Link>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-[11px] text-slate-500">
            <p>© 2026 Buddha Library • A Unit of Flair Foundation. All rights reserved.</p>
            <p className="font-serif italic text-slate-400">"बुद्धम शरणम् गच्छामि।"</p>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
