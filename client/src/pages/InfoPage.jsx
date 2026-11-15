import { ArrowLeft, ArrowRight, Leaf, Mail, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import Navbar from '../components/Navbar'

const legalCopy = {
  privacy: {
    eyebrow: 'YOUR DETAILS, YOURS TO KEEP',
    title: 'Privacy, thoughtfully.',
    intro: 'We collect only what helps ReVendo work: account details, listings, orders, and the settings you choose.',
    sections: [
      ['What we collect', 'Account details such as your name, email, phone, and location; listings and images you upload; saved finds, orders, and messages; and basic service logs needed to keep the marketplace safe.'],
      ['What other people can see', 'Your public seller profile may show your name, profile photo, bio, location, and listings. We never show your private email address or phone number on a public listing. Delivery details are shared with the seller only when you place an order.'],
      ['How we use it', 'We use your information to operate accounts, publish listings after moderation, fulfill marketplace requests, send account notifications, prevent abuse, and meet legal obligations. We do not sell personal information.'],
      ['Your choices', 'You can edit your profile and contact ReVendo to request access, correction, or deletion of account information. Some records may need to be retained to resolve orders or meet legal requirements.'],
      ['Security and retention', 'Passwords are hashed and session tokens are stored in HTTP-only cookies. No online payment processing is enabled in this local demo. We retain information only as long as needed for the marketplace and its safety.'],
      ['Questions', 'For privacy requests, write to hello@revendo.local. Replace this development contact with a monitored address before launching publicly.'],
    ],
  },
  terms: {
    eyebrow: 'A FEW THINGS WORTH KNOWING',
    title: 'Good things, good rules.',
    intro: 'ReVendo helps people discover and exchange pre-loved goods. Keep it honest, kind, and safe for everyone.',
    sections: [
      ['Your account', 'You must provide accurate account information and keep your sign-in details secure. You are responsible for activity under your account. Administrators may suspend accounts that violate these terms.'],
      ['Listings', 'You may list items you are allowed to sell. Descriptions, condition, images, price, and location must be accurate. Do not list illegal, unsafe, counterfeit, or misleading items. Listings may be reviewed, rejected, or removed.'],
      ['Buying and selling', 'Products are individual, second-hand items. Availability is checked by the server when an order is placed. Sellers arrange delivery directly with buyers. Contact details are shared only for fulfilling that order.'],
      ['Payments in this local build', 'Checkout currently supports a clearly labeled cash-on-delivery demo flow only. ReVendo does not collect or process payment card information, and no online payment is taken. Do not send money through this demo.'],
      ['Safety and conduct', 'Communicate respectfully, meet in safe public places when meeting locally, and never share passwords or verification codes. Report suspicious listings or behavior for review.'],
      ['Service availability', 'ReVendo is provided as-is during development. Features may change while the marketplace is being built. We are not a party to the private sale between buyers and sellers.'],
      ['Contact', 'Questions about these terms can be sent to hello@revendo.local. These development terms should be reviewed for your jurisdiction before a public launch.'],
    ],
  },
}

export function InfoPage({ kind }) {
  const legal = legalCopy[kind]
  if (!legal) return <AboutPage />

  return (
    <>
      <Navbar />
      <main className="info-page page-gutter">
        <Link className="back-link" to="/"><ArrowLeft size={16} /> Back to ReVendo</Link>
        <header className="info-page-heading"><span className="eyebrow">{legal.eyebrow}</span><h1>{legal.title}</h1><p>{legal.intro}</p></header>
        <div className="legal-sections">{legal.sections.map(([title, copy], index) => <section key={title}><span>{String(index + 1).padStart(2, '0')}</span><div><h2>{title}</h2><p>{copy}</p></div></section>)}</div>
      </main>
      <Footer />
    </>
  )
}

export function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="info-page page-gutter about-page">
        <Link className="back-link" to="/"><ArrowLeft size={16} /> Back to ReVendo</Link>
        <header className="about-hero"><span className="eyebrow">A LITTLE MORE THOUGHTFUL</span><h1>Good things deserve<br /><em>another story.</em></h1><p>We made ReVendo for the things we already love: objects with a little life left in them, and people ready to give them a new home.</p><Link className="commerce-primary" to="/browse">Find your next good thing <ArrowRight size={15} /></Link></header>
        <div className="about-values"><article><Leaf size={19} /><h2>Less waste, more wonder.</h2><p>Passing things along keeps useful things in use and gives each piece a new chapter.</p></article><article><ShieldCheck size={19} /><h2>People, not storefronts.</h2><p>ReVendo brings neighbors together around the pre-loved finds they care about.</p></article><article><Mail size={19} /><h2>Thoughtful by design.</h2><p>Clear listings, safe communication, and a little more care at every step.</p></article></div>
        <div className="about-footnote"><span>GIVE GOOD THINGS A SECOND LIFE.</span><Link to="/sell">Pass one along <ArrowRight size={15} /></Link></div>
      </main>
      <Footer />
    </>
  )
}

export function ContactPage() {
  function submit(event) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const subject = encodeURIComponent(`ReVendo help: ${formData.get('subject')}`)
    const body = encodeURIComponent(`From: ${formData.get('name')}\nEmail: ${formData.get('email')}\n\n${formData.get('message')}`)
    window.location.href = `mailto:hello@revendo.local?subject=${subject}&body=${body}`
  }

  return (
    <>
      <Navbar />
      <main className="info-page page-gutter contact-page">
        <Link className="back-link" to="/"><ArrowLeft size={16} /> Back to ReVendo</Link>
        <header className="info-page-heading"><span className="eyebrow">WE’RE ALL EARS</span><h1>Let’s talk good things.</h1><p>Questions, a kind idea, something that needs a little help? We’re listening.</p></header>
        <div className="contact-layout"><form className="contact-form" onSubmit={submit}><label>Your name<input name="name" required maxLength={80} /></label><label>Email address<input name="email" type="email" required /></label><label>What can we help with?<select name="subject"><option>Something else</option><option>Account help</option><option>Order question</option><option>Listing support</option><option>Privacy request</option></select></label><label>Your note<textarea name="message" rows={5} required maxLength={2000} placeholder="Tell us a little more…" /></label><button className="commerce-primary" type="submit">Open email to ReVendo <ArrowRight size={15} /></button><small>This opens your email app; this development site does not send contact forms itself.</small></form><aside className="contact-aside"><span className="contact-aside-icon"><Mail size={20} /></span><span className="eyebrow">A NOTE FROM YOU</span><h2>We’ll get back<br />to you soon.</h2><p>For now, email us at <a href="mailto:hello@revendo.local">hello@revendo.local</a>. Replace this development inbox with a monitored support address before launch.</p><span className="contact-note">Usually around within 1–2 business days.</span></aside></div>
      </main>
      <Footer />
    </>
  )
}
