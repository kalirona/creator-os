import { db } from '../src/lib/db'

async function seed() {
  console.log('🌱 Seeding CreatorOS...')

  // Workspace + Owner
  const workspace = await db.workspace.create({
    data: {
      name: 'CreatorOS Studio',
      slug: 'creatoros',
      plan: 'SCALE',
      logoUrl: null,
    },
  })

  const user = await db.user.create({
    data: {
      email: 'founder@creatoros.io',
      name: 'Alex Rivera',
      role: 'OWNER',
      credits: 4280,
      bio: 'Creator educator building the future of online business.',
      avatarUrl: null,
      memberships: {
        create: { workspaceId: workspace.id, role: 'OWNER' },
      },
    },
  })

  // Team members
  const teamNames = [
    ['Jamie Chen', 'jamie@creatoros.io', 'ADMIN'],
    ['Priya Patel', 'priya@creatoros.io', 'INSTRUCTOR'],
    ['Marcus Lee', 'marcus@creatoros.io', 'MODERATOR'],
    ['Sofia Diaz', 'sofia@creatoros.io', 'MANAGER'],
  ]
  for (const [name, email, role] of teamNames) {
    await db.user.create({
      data: {
        email,
        name,
        role,
        credits: 1000,
        memberships: { create: { workspaceId: workspace.id, role } },
      },
    })
  }

  // Courses with sections + lessons
  const courses = [
    { title: 'Launch Your First Digital Product', category: 'Marketing', price: 199, level: 'BEGINNER', rating: 4.9, students: 1240, desc: 'A complete system to design, build, and launch a digital product that sells on day one.' },
    { title: 'YouTube Growth Engine 2025', category: 'YouTube', price: 249, level: 'INTERMEDIATE', rating: 4.8, students: 980, desc: 'The exact framework top creators use to hit 100K subscribers with consistent, algorithm-friendly content.' },
    { title: 'Community Building Mastery', category: 'Community', price: 179, level: 'INTERMEDIATE', rating: 4.9, students: 760, desc: 'Turn an audience into a thriving paid community that members never want to leave.' },
    { title: 'Email Marketing That Converts', category: 'Email', price: 149, level: 'BEGINNER', rating: 4.7, students: 1530, desc: 'Write emails people actually open, read, and buy from — with proven templates included.' },
    { title: 'Notion Creator OS', category: 'Productivity', price: 99, level: 'BEGINNER', rating: 4.9, students: 2100, desc: 'The complete Notion system to run your entire creator business from one dashboard.' },
    { title: 'AI Content Studio Playbook', category: 'AI', price: 299, level: 'ADVANCED', rating: 4.9, students: 540, desc: 'Use AI to produce a month of content in a single afternoon — without losing your voice.' },
  ]
  for (const c of courses) {
    const course = await db.course.create({
      data: {
        workspaceId: workspace.id,
        title: c.title,
        description: c.desc,
        category: c.category,
        price: c.price,
        level: c.level,
        rating: c.rating,
        studentsCount: c.students,
        thumbnailUrl: null,
      },
    })
    const sectionCount = 3
    for (let s = 0; s < sectionCount; s++) {
      const section = await db.section.create({
        data: { courseId: course.id, title: `Section ${s + 1}: ${['Foundations', 'Build & Launch', 'Scale & Automate'][s]}`, position: s },
      })
      const lessonCount = 4
      for (let l = 0; l < lessonCount; l++) {
        await db.lesson.create({
          data: {
            sectionId: section.id,
            title: `Lesson ${s + 1}.${l + 1}: ${['Intro & mindset', 'The core framework', 'Step-by-step walkthrough', 'Action items & worksheet'][l]}`,
            content: 'In this lesson you will learn the fundamentals and a repeatable framework you can apply immediately.',
            type: ['VIDEO', 'TEXT', 'VIDEO', 'PDF'][l],
            duration: 8 + l * 6,
            position: l,
            isPreview: l === 0,
          },
        })
      }
    }
  }

  // Enrollments for the owner
  const allCourses = await db.course.findMany()
  for (const c of allCourses.slice(0, 3)) {
    await db.enrollment.create({ data: { userId: user.id, courseId: c.id, progress: Math.random() * 100 } })
  }

  // Products
  const products = [
    { name: 'Creator Landing Page Pack', type: 'DIGITAL', price: 49, sales: 832, rating: 4.9, desc: '12 high-converting landing page templates for digital products and courses.' },
    { name: 'Notion Content Planner', type: 'DIGITAL', price: 29, sales: 1240, rating: 4.8, desc: 'Plan, write, and schedule every piece of content in one beautiful Notion dashboard.' },
    { name: 'YouTube Script Vault', type: 'DIGITAL', price: 39, sales: 640, rating: 4.7, desc: '50 proven video script templates across 8 niches. Just fill in the blanks.' },
    { name: 'Email Sequence Bundle', type: 'BUNDLE', price: 79, sales: 410, rating: 4.9, desc: 'Welcome, launch, and re-engagement sequences — written by 7-figure copywriters.' },
    { name: 'Prompt Pack: 500 AI Prompts', type: 'DIGITAL', price: 19, sales: 2100, rating: 4.8, desc: '500 categorized prompts for content, marketing, sales, and product creation.' },
    { name: 'Pro Membership', type: 'MEMBERSHIP', price: 199, sales: 530, rating: 5.0, desc: 'Monthly access to all courses, the private community, and weekly office hours.' },
    { name: 'Canva Template Mega Bundle', type: 'DIGITAL', price: 59, sales: 980, rating: 4.7, desc: '200+ Canva templates for thumbnails, carousels, lead magnets, and more.' },
    { name: 'CreatorOS Everything Bundle', type: 'BUNDLE', price: 499, sales: 280, rating: 5.0, desc: 'Every product, every course, every template — lifetime access. Best value.' },
  ]
  for (const p of products) {
    await db.product.create({
      data: { workspaceId: workspace.id, name: p.name, description: p.desc, type: p.type, price: p.price, salesCount: p.sales, rating: p.rating },
    })
  }

  // Orders (last 30 days)
  const customers: { name: string; email: string; tags: string; ltv: number; orders: number; status: string }[] = []
  const firstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'Lucas', 'Mia', 'Logan', 'Charlotte', 'Aiden', 'Amelia', 'Jack', 'Harper', 'Leo', 'Zoe', 'Owen']
  const lastNames = ['Smith', 'Johnson', 'Brown', 'Garcia', 'Miller', 'Davis', 'Lopez', 'Wilson', 'Anderson', 'Taylor', 'Moore', 'Jackson', 'White', 'Harris', 'Martin', 'Lee', 'Clark', 'Walker', 'Young', 'King']
  for (let i = 0; i < 24; i++) {
    const name = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`
    const email = `${name.toLowerCase().replace(' ', '.')}@email.com`
    const ltv = Math.round((49 + Math.random() * 450) * 100) / 100
    const orders = 1 + Math.floor(Math.random() * 6)
    customers.push({ name, email, tags: ['VIP', 'Newsletter', 'Customer', 'Beta'][i % 4], ltv, orders, status: i % 7 === 0 ? 'CHURNED' : 'ACTIVE' })
  }
  for (const c of customers) {
    await db.customer.create({ data: { workspaceId: workspace.id, name: c.name, email: c.email, tags: c.tags, ltv: c.ltv, ordersCount: c.orders, status: c.status } })
  }

  const allProducts = await db.product.findMany()
  for (let i = 0; i < 40; i++) {
    const prod = allProducts[i % allProducts.length]
    const cust = customers[i % customers.length]
    const daysAgo = i
    await db.order.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        productId: prod.id,
        amount: prod.price,
        customerEmail: cust.email,
        customerName: cust.name,
        status: i % 11 === 0 ? 'REFUNDED' : 'COMPLETED',
        createdAt: new Date(Date.now() - daysAgo * 86400000),
      },
    })
  }

  // Community posts
  const posts = [
    { cat: 'Wins', title: 'Hit $20K MRR — here is the exact playbook', content: 'After 14 months I finally crossed $20K MRR. The biggest lever was switching from one-off products to a membership. Here are the 5 things that moved the needle...', likes: 142, comments: 38 },
    { cat: 'Questions', title: 'Best email tool for a 10K list under $50/mo?', content: 'I am outgrowing my current ESP and need something that handles automations well without breaking the bank. What are you all using?', likes: 34, comments: 52 },
    { cat: 'Marketing', title: 'The thumbnail formula that 3x my CTR', content: 'I tested 6 thumbnail styles over 30 videos. One clear winner: high-contrast background, 3-word headline, single face with strong emotion...', likes: 211, comments: 67 },
    { cat: 'Announcements', title: 'New AI Studio tools just dropped', content: 'We just shipped the Course Generator and Sales Page Generator. Try them out and let us know what you want next!', likes: 89, comments: 24, pinned: true },
    { cat: 'Wins', title: 'First $1K from a single email broadcast', content: 'Used the welcome sequence template from the Email course and sent a broadcast to my 2.4K list. $1,180 in sales from one email...', likes: 76, comments: 19 },
    { cat: 'Community', title: 'Weekly co-working Friday — drop your goal', content: 'Reply with one thing you will ship by Friday. We will check back in on Friday and celebrate. Accountability works.', likes: 58, comments: 91 },
  ]
  for (const p of posts) {
    await db.communityPost.create({
      data: {
        workspaceId: workspace.id,
        userId: user.id,
        category: p.cat,
        title: p.title,
        content: p.content,
        likesCount: p.likes,
        commentsCount: p.comments,
        isPinned: p.pinned || false,
      },
    })
  }

  // Email campaigns
  const campaigns = [
    { name: 'Black Friday Mega Sale', subject: '48 hours: 50% off everything', type: 'BROADCAST', status: 'SENT', recipients: 12400, openRate: 0.52, clickRate: 0.18 },
    { name: 'Welcome Sequence v3', subject: 'Your starter kit is inside', type: 'SEQUENCE', status: 'SENT', recipients: 8400, openRate: 0.68, clickRate: 0.31 },
    { name: 'New Course Launch', subject: 'It is finally live 🚀', type: 'BROADCAST', status: 'SENT', recipients: 11000, openRate: 0.47, clickRate: 0.22 },
    { name: 'Abandoned Cart Recovery', subject: 'You left this behind', type: 'AUTOMATION', status: 'SENT', recipients: 3200, openRate: 0.41, clickRate: 0.14 },
    { name: 'Weekly Newsletter #142', subject: '5 tools I use every day', type: 'BROADCAST', status: 'DRAFT', recipients: 12600, openRate: 0, clickRate: 0 },
    { name: 'Re-engagement: We miss you', subject: 'Should I delete you?', type: 'AUTOMATION', status: 'SCHEDULED', recipients: 2400, openRate: 0, clickRate: 0 },
  ]
  for (const c of campaigns) {
    await db.emailCampaign.create({ data: { workspaceId: workspace.id, ...c } })
  }

  // Affiliates
  const affs = [
    { name: 'Jordan Blake', email: 'jordan@email.com', code: 'JORDAN20', clicks: 3200, conversions: 142, earnings: 4280 },
    { name: 'Taylor Quinn', email: 'taylor@email.com', code: 'TAYLOR10', clicks: 2100, conversions: 89, earnings: 2670 },
    { name: 'Casey Rivers', email: 'casey@email.com', code: 'CASEY15', clicks: 1800, conversions: 76, earnings: 2280 },
    { name: 'Riley Stone', email: 'riley@email.com', code: 'RILEY25', clicks: 980, conversions: 34, earnings: 1020 },
    { name: 'Avery Knox', email: 'avery@email.com', code: 'AVERY30', clicks: 640, conversions: 21, earnings: 630 },
  ]
  for (const a of affs) {
    await db.affiliate.create({ data: { workspaceId: workspace.id, ...a } })
  }

  // Web pages
  const pages = [
    { title: 'Homepage', slug: 'home', type: 'HOME', visits: 48200 },
    { title: 'AI Content Course — Sales Page', slug: 'ai-content-studio', type: 'SALES', visits: 12400 },
    { title: 'Pricing', slug: 'pricing', type: 'PRICING', visits: 8900 },
    { title: 'Free Notion Template Landing', slug: 'free-notion-template', type: 'LANDING', visits: 23100 },
    { title: 'About CreatorOS', slug: 'about', type: 'ABOUT', visits: 3200 },
    { title: 'Blog: 10 Creator Tools', slug: 'blog/10-creator-tools', type: 'BLOG', visits: 5600 },
  ]
  for (const p of pages) {
    await db.webPage.create({ data: { workspaceId: workspace.id, ...p } })
  }

  // Membership plans
  const plans = [
    { name: 'Free', price: 0, interval: 'MONTHLY', members: 8400 },
    { name: 'Pro', price: 199, interval: 'MONTHLY', members: 1240 },
    { name: 'Pro Annual', price: 1990, interval: 'YEARLY', members: 380 },
    { name: 'Lifetime', price: 4990, interval: 'LIFETIME', members: 92 },
  ]
  for (const p of plans) {
    await db.membershipPlan.create({ data: { workspaceId: workspace.id, ...p } })
  }

  console.log('✅ Seed complete!')
  console.log(`   Workspace: ${workspace.id}`)
  console.log(`   User: ${user.email} (credits: 4280)`)
  const counts = {
    courses: await db.course.count(),
    products: await db.product.count(),
    orders: await db.order.count(),
    customers: await db.customer.count(),
    posts: await db.communityPost.count(),
    campaigns: await db.emailCampaign.count(),
    affiliates: await db.affiliate.count(),
    pages: await db.webPage.count(),
    plans: await db.membershipPlan.count(),
  }
  console.log('   Counts:', counts)
}

seed()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
