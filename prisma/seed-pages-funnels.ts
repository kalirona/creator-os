import { db } from '../src/lib/db'

const SECTION_DEFAULTS: Record<string, unknown> = {
  HERO: { headline: 'Build your creator empire, all in one place', subheadline: 'Courses, products, community, email, and AI — everything you need to turn your audience into a business.', ctaText: 'Start free', ctaSecondary: 'Watch demo', emoji: '🚀' },
  FEATURES: { heading: 'Everything in one platform', subheading: 'Stop juggling 12 tools. CreatorOS brings it all together.', items: [{ icon: '🎓', title: 'Courses', description: 'Build and sell unlimited courses with drip content.' }, { icon: '📦', title: 'Products', description: 'Sell templates, downloads, and bundles.' }, { icon: '👥', title: 'Community', description: 'A thriving paid community.' }, { icon: '✉️', title: 'Email', description: 'Broadcasts and automations that convert.' }] },
  BENEFITS: { heading: 'Why creators choose us', items: [{ title: 'Save time', description: 'Replace 5+ tools with one platform.' }, { title: 'Earn more', description: 'Built-in upsells, funnels, and affiliates.' }, { title: 'Grow faster', description: 'AI tools that 10x your content output.' }] },
  PRICING: { heading: 'Simple pricing', plans: [{ name: 'Free', price: 0, interval: 'forever', features: ['1 course', '50 members', 'Basic community'], cta: 'Get started', highlighted: false }, { name: 'Pro', price: 49, interval: '/mo', features: ['Unlimited courses', '1,000 members', 'Email automations', '5,000 AI credits'], cta: 'Start trial', highlighted: true }] },
  TESTIMONIALS: { heading: 'Loved by 10,000+ creators', items: [{ name: 'Sarah K.', role: 'YouTuber, 240K subs', quote: 'I replaced 5 tools and saved $300/mo. Launch did $42K in week one.' }, { name: 'Marcus T.', role: 'Course creator', quote: 'The AI Course Generator built my entire $297 course in 10 minutes.' }, { name: 'Priya N.', role: 'Coach', quote: 'My community went from 0 to 1,200 paying members in 90 days.' }] },
  FAQ: { heading: 'Frequently asked questions', items: [{ question: 'Is there a free trial?', answer: 'Yes! Start free, no credit card required.' }, { question: 'Can I cancel anytime?', answer: 'Absolutely. Cancel with one click, no questions asked.' }, { question: 'Do you take a cut of my sales?', answer: 'Never. You keep 100% of your revenue. We only charge the monthly plan.' }] },
  CTA: { headline: 'Ready to build your creator business?', subtext: 'Join 10,000+ creators using CreatorOS.', ctaText: 'Start free today' },
  NEWSLETTER: { heading: 'Get creator tips weekly', subtext: 'Join 12,400 creators getting actionable advice every Tuesday.', placeholder: 'you@email.com', ctaText: 'Subscribe' },
  FOOTER: { brand: 'CreatorOS', tagline: 'The all-in-one platform for creators.', links: [{ label: 'Product', items: ['Courses', 'Products', 'Community', 'Pricing'] }, { label: 'Company', items: ['About', 'Blog', 'Careers', 'Contact'] }] },
  VIDEO: { heading: 'See it in action', videoUrl: '', description: 'Watch a 2-minute demo of CreatorOS' },
  GALLERY: { heading: 'Loved by creators', images: [] },
  COUNTDOWN: { heading: 'Launch ends in', endDate: '', ctaText: 'Get access now' },
  TEXT: { text: 'Write your paragraph here.' },
  HEADING: { text: 'Section Heading', alignment: 'center' },
}

async function createPage(workspaceId: string, data: { title: string; slug: string; type: string; status?: string; category?: string }, sectionTypes: string[]) {
  const page = await db.page.create({
    data: { workspaceId, title: data.title, slug: data.slug, type: data.type, status: data.status || 'PUBLISHED', category: data.category || 'General', seoTitle: data.title, seoDescription: `${data.title} — CreatorOS` },
  })
  for (let i = 0; i < sectionTypes.length; i++) {
    await db.pageSection.create({
      data: { pageId: page.id, type: sectionTypes[i], content: JSON.stringify(SECTION_DEFAULTS[sectionTypes[i]] || {}), position: i },
    })
  }
  return page
}

async function seed() {
  console.log('🌱 Seeding Pages & Funnels...')
  const workspace = await db.workspace.findFirst()
  if (!workspace) { console.error('No workspace'); process.exit(1) }

  // Clear old data
  await db.pageSection.deleteMany()
  await db.pageVersion.deleteMany()
  await db.funnelStep.deleteMany()
  await db.funnel.deleteMany()
  await db.blogPost.deleteMany()
  await db.page.deleteMany()
  await db.siteSetting.deleteMany()

  // Pages
  await createPage(workspace.id, { title: 'Homepage', slug: 'home', type: 'HOME' }, ['HERO', 'FEATURES', 'TESTIMONIALS', 'PRICING', 'CTA', 'FOOTER'])
  await createPage(workspace.id, { title: 'About', slug: 'about', type: 'ABOUT' }, ['HERO', 'TEXT', 'FOOTER'])
  await createPage(workspace.id, { title: 'Contact', slug: 'contact', type: 'CONTACT' }, ['HERO', 'TEXT', 'FOOTER'])
  await createPage(workspace.id, { title: 'Privacy Policy', slug: 'privacy', type: 'LEGAL' }, ['HEADING', 'TEXT'])
  await createPage(workspace.id, { title: 'Terms of Service', slug: 'terms', type: 'LEGAL' }, ['HEADING', 'TEXT'])
  await createPage(workspace.id, { title: 'Thank You', slug: 'thank-you', type: 'THANK_YOU' }, ['HERO', 'TEXT', 'CTA'])

  // Landing Pages (AI-generated style)
  await createPage(workspace.id, { title: 'AI Content Studio — Sales Page', slug: 'ai-content-studio', type: 'LANDING', category: 'Course' }, ['HERO', 'BENEFITS', 'FEATURES', 'TESTIMONIALS', 'PRICING', 'FAQ', 'CTA', 'FOOTER'])
  await createPage(workspace.id, { title: 'Pro Membership — Landing', slug: 'pro-membership', type: 'LANDING', category: 'Membership' }, ['HERO', 'BENEFITS', 'FEATURES', 'PRICING', 'TESTIMONIALS', 'FAQ', 'CTA', 'FOOTER'])
  await createPage(workspace.id, { title: 'Notion Template Pack — Landing', slug: 'notion-template-pack', type: 'LANDING', category: 'Product' }, ['HERO', 'FEATURES', 'TESTIMONIALS', 'PRICING', 'FAQ', 'CTA', 'FOOTER'])
  await createPage(workspace.id, { title: 'Free AI Prompts Lead Magnet', slug: 'free-ai-prompts', type: 'LANDING', category: 'LeadMagnet' }, ['HERO', 'BENEFITS', 'NEWSLETTER', 'FOOTER'])
  await createPage(workspace.id, { title: 'Creator Community — Join', slug: 'community-join', type: 'LANDING', category: 'Community' }, ['HERO', 'BENEFITS', 'TESTIMONIALS', 'PRICING', 'CTA', 'FOOTER'])

  console.log('   ✓ Pages + landing pages seeded')

  // Funnel
  const courseLanding = await db.page.findFirst({ where: { slug: 'ai-content-studio' } })
  const funnel = await db.funnel.create({
    data: { workspaceId: workspace.id, slug: 'ai-content-studio-launch', name: 'AI Content Studio Launch Funnel', description: 'Course sales funnel with upsell and email sequence', type: 'SALES', status: 'LIVE', visits: 8420, conversions: 312, revenue: 92364 },
  })
  const steps = [
    { name: 'Course Landing Page', type: 'LANDING', pageId: courseLanding?.id },
    { name: 'Checkout', type: 'CHECKOUT' },
    { name: 'AI Prompts Upsell', type: 'UPSELL' },
    { name: 'Template Discount Downsell', type: 'DOWNSELL' },
    { name: 'Thank You Page', type: 'THANK_YOU' },
    { name: 'Welcome Email Sequence', type: 'EMAIL' },
    { name: 'Community Invite', type: 'COMMUNITY_INVITE' },
    { name: 'Course Access', type: 'COURSE_ACCESS' },
  ]
  for (let i = 0; i < steps.length; i++) {
    await db.funnelStep.create({ data: { funnelId: funnel.id, name: steps[i].name, type: steps[i].type, position: i, pageId: steps[i].pageId || null, isRequired: i < 5 } })
  }
  console.log('   ✓ Funnel with 8 steps seeded')

  // Blog posts
  const posts = [
    { title: '10 AI Tools Every Creator Should Use in 2025', slug: '10-ai-tools-creators', category: 'AI', tags: 'ai,tools,productivity', excerpt: 'The complete list of AI tools that will 10x your content output this year.', content: 'AI is transforming how creators work...' },
    { title: 'How I Built a $10K/mo Notion Template Business', slug: '10k-notion-business', category: 'Business', tags: 'notion,templates,revenue', excerpt: 'The exact playbook I used to go from 0 to $10K MRR selling Notion templates.', content: 'It started with a single template...' },
    { title: 'The Ultimate Guide to Email Funnels for Creators', slug: 'email-funnels-guide', category: 'Email', tags: 'email,funnels,automation', excerpt: 'Everything you need to know about building email funnels that convert.', content: 'Email funnels are the backbone...' },
    { title: 'Why Community Is the New Content', slug: 'community-new-content', category: 'Community', tags: 'community,audience,growth', excerpt: 'Audiences are fleeting. Communities are durable. Here is why.', content: 'In 2025, attention is fragmented...' },
  ]
  for (const p of posts) {
    await db.blogPost.create({ data: { workspaceId: workspace.id, ...p, status: 'PUBLISHED', author: 'Alex Rivera', publishedAt: new Date(Date.now() - Math.random() * 30 * 86400000) } })
  }
  console.log('   ✓ 4 blog posts seeded')

  // Site Settings
  const settings = [
    { key: 'brand_name', value: 'CreatorOS', category: 'brand' },
    { key: 'brand_logo', value: '', category: 'brand' },
    { key: 'brand_favicon', value: '', category: 'brand' },
    { key: 'brand_primary_color', value: '#10b981', category: 'brand' },
    { key: 'brand_font', value: 'Inter', category: 'brand' },
    { key: 'header_nav', value: JSON.stringify([{ label: 'Home', url: '/' }, { label: 'Courses', url: '/courses' }, { label: 'Pricing', url: '/pricing' }, { label: 'Blog', url: '/blog' }]), category: 'header' },
    { key: 'header_show_login', value: 'true', category: 'header' },
    { key: 'announcement_bar', value: JSON.stringify({ enabled: true, text: '🎉 Black Friday: 50% off all annual plans!', link: '/pricing' }), category: 'header' },
    { key: 'footer_text', value: '© 2025 CreatorOS. All rights reserved.', category: 'footer' },
    { key: 'footer_links', value: JSON.stringify([{ label: 'Privacy', url: '/privacy' }, { label: 'Terms', url: '/terms' }, { label: 'Contact', url: '/contact' }]), category: 'footer' },
    { key: 'google_analytics', value: 'G-XXXXXXXXXX', category: 'analytics' },
    { key: 'meta_pixel', value: '', category: 'analytics' },
    { key: 'custom_scripts', value: '', category: 'analytics' },
    { key: 'seo_default_title', value: 'CreatorOS — The All-in-One Platform for Creators', category: 'seo' },
    { key: 'seo_default_description', value: 'Sell courses, products, and memberships. Build a community. Create content 10x faster with AI.', category: 'seo' },
    { key: 'seo_og_image', value: '', category: 'seo' },
    { key: 'seo_twitter_card', value: 'summary_large_image', category: 'seo' },
    { key: 'seo_robots', value: 'index, follow', category: 'seo' },
    { key: 'primary_domain', value: 'creatoros.io', category: 'domains' },
    { key: 'ssl_status', value: 'active', category: 'domains' },
  ]
  for (const s of settings) {
    await db.siteSetting.create({ data: s })
  }
  console.log(`   ✓ ${settings.length} site settings seeded`)

  console.log('✅ Pages & Funnels seed complete!')
  const counts = {
    pages: await db.page.count(),
    sections: await db.pageSection.count(),
    funnels: await db.funnel.count(),
    funnelSteps: await db.funnelStep.count(),
    blogPosts: await db.blogPost.count(),
    siteSettings: await db.siteSetting.count(),
  }
  console.log('   Counts:', counts)
}

seed().catch((e) => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
