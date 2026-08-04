import { db } from '@/lib/db'
import { logAuditEvent } from '@/lib/logging'
import { type RequestContext, requirePermission } from '@/lib/context'

export class CommunityService {
  // ===== Community =====
  async getCommunity(ctx: RequestContext) {
    await requirePermission(ctx, 'community_post', 'read')
    let community = await db.community.findFirst({
      where: { workspaceId: ctx.workspace.id },
      include: {
        spaces: { include: { _count: { select: { members: true } } } },
        _count: {
          select: {
            members: true,
            posts: true,
            events: true,
          }
        }
      }
    })

    if (!community) {
      community = await db.community.create({
        data: {
          workspaceId: ctx.workspace.id,
          name: ctx.workspace.name + ' Community',
          slug: ctx.workspace.slug + '-community',
          description: 'Community for ' + ctx.workspace.name,
        },
        include: {
          spaces: { include: { _count: { select: { members: true } } } },
          _count: {
            select: {
              members: true,
              posts: true,
              events: true,
            },
          }
        }
      })
    }

    return community
  }

  async updateCommunity(ctx: RequestContext, data: {
    name?: string
    description?: string
    bio?: string
    iconUrl?: string | null
    bannerUrl?: string | null
    privacy?: string
    memberApproval?: string
    allowPosting?: string
    allowMedia?: boolean
    allowComments?: boolean
    allowReactions?: boolean
    allowInvites?: boolean
    color?: string
  }) {
    await requirePermission(ctx, 'community_post', 'manage')
    const community = await db.community.findFirst({ where: { workspaceId: ctx.workspace.id } })
    if (!community) throw new Error('Community not found')

    const updated = await db.community.update({
      where: { id: community.id },
      data,
    })

    await logAuditEvent('community.update', {
      userId: ctx.user.id, workspaceId: ctx.workspace.id, resource: 'Community', resourceId: community.id,
    })

    return updated
  }

  // ===== Members =====
  async listMembers(ctx: RequestContext, params: {
    search?: string
    role?: string
    status?: string
    sortBy?: string
    page?: number
    perPage?: number
  } = {}) {
    await requirePermission(ctx, 'community_member', 'read')
    const community = await this.getCommunity(ctx)
    const { search = '', role, status, sortBy = 'reputation', perPage = 50 } = params

    const where: any = { communityId: community.id }
    if (search) {
      where.OR = [{ badges: { contains: search } }]
    }
    if (role) where.role = role
    if (status) where.status = status

    const orderBy: any = {}
    if (sortBy === 'reputation') orderBy.reputation = 'desc'
    else if (sortBy === 'newest') orderBy.joinedAt = 'desc'
    else if (sortBy === 'active') orderBy.lastActiveAt = 'desc'

    const members = await db.communityMember.findMany({
      where,
      orderBy,
      include: { user: true },
      take: perPage,
    })

    return members
  }

  async getMember(ctx: RequestContext, id: string) {
    await requirePermission(ctx, 'community_member', 'read')
    const member = await db.communityMember.findUnique({
      where: { id },
      include: {
        user: true,
        awardedBadges: { include: { badge: true } },
      },
    })
    if (!member) throw new Error('Member not found')
    if (member.workspaceId !== ctx.workspace.id) throw new Error('Access denied')
    return member
  }

  async updateMember(ctx: RequestContext, memberId: string, data: {
    role?: string
    status?: string
    bio?: string
    website?: string
    socialLinks?: string
  }) {
    await requirePermission(ctx, 'community_member', 'manage')
    const member = await db.communityMember.findUnique({ where: { id: memberId } })
    if (!member) throw new Error('Member not found')
    if (member.workspaceId !== ctx.workspace.id) throw new Error('Access denied')

    const updated = await db.communityMember.update({
      where: { id: memberId },
      data,
      include: { user: true },
    })

    await logAuditEvent('community_member.update', {
      userId: ctx.user.id, workspaceId: ctx.workspace.id, resource: 'CommunityMember', resourceId: memberId,
    })

    return updated
  }

  async suspendMember(ctx: RequestContext, memberId: string, suspended: boolean, reason?: string) {
    await requirePermission(ctx, 'community_member', 'manage')
    await db.communityMember.update({
      where: { id: memberId },
      data: {
        status: suspended ? 'SUSPENDED' : 'ACTIVE',
      },
    })

    await logAuditEvent('community_member.suspend', {
      userId: ctx.user.id, workspaceId: ctx.workspace.id, resource: 'CommunityMember', resourceId: memberId,
      metadata: { suspended, reason },
    })
  }

  // ===== Posts =====
  async listPosts(ctx: RequestContext, params: {
    spaceId?: string
    authorId?: string
    type?: string
    search?: string
    isPinned?: boolean
    isDraft?: boolean
    page?: number
    perPage?: number
    cursor?: string
  } = {}) {
    await requirePermission(ctx, 'community_post', 'read')
    const community = await this.getCommunity(ctx)
    const { spaceId, authorId, type, search, isPinned, perPage = 20, cursor } = params

    const where: any = {
      communityId: community.id,
      isDraft: false,
    }
    if (spaceId) where.spaceId = spaceId
    if (authorId) where.authorId = authorId
    if (type) where.type = type
    if (isPinned !== undefined) where.isPinned = isPinned
    if (search) {
      where.OR = [{ title: { contains: search, mode: 'insensitive' } }, { content: { contains: search, mode: 'insensitive' } }]
    }

    const posts = await db.post.findMany({
      where,
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: { include: { user: true } },
        space: true,
        _count: { select: { comments: true, reactions: true } },
      },
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      take: perPage + 1,
    })

    const hasMore = posts.length > perPage
    const result = posts.slice(0, perPage)

    return { posts: result, hasMore }
  }

  async getPost(ctx: RequestContext, id: string) {
    await requirePermission(ctx, 'community_post', 'read')
    const post = await db.post.findUnique({
      where: { id },
      include: {
        author: { include: { user: true } },
        space: true,
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: 'asc' },
          include: {
            author: { include: { user: true } },
            _count: { select: { replies: true, reactions: true } },
          },
        },
        _count: { select: { comments: true, reactions: true } },
      },
    })
    if (!post) throw new Error('Post not found')
    if (post.workspaceId !== ctx.workspace.id) throw new Error('Access denied')
    return post
  }

  async createPost(ctx: RequestContext, data: {
    spaceId?: string
    title?: string
    content: string
    type?: string
    mediaIds?: string[]
    pollOptions?: string[]
    isDraft?: boolean
    isScheduled?: boolean
    scheduledAt?: Date
  }) {
    await requirePermission(ctx, 'community_post', 'create')
    const community = await this.getCommunity(ctx)

    let member = await db.communityMember.findFirst({
      where: { communityId: community.id, userId: ctx.user.id },
    })
    if (!member) {
      member = await db.communityMember.create({
        data: {
          communityId: community.id,
          userId: ctx.user.id,
          workspaceId: ctx.workspace.id,
          role: ctx.user.role === 'OWNER' ? 'OWNER' : 'MEMBER',
        },
      })
    }

    if (data.spaceId) {
      const space = await db.communitySpace.findFirst({
        where: { id: data.spaceId, communityId: community.id },
      })
      if (!space) throw new Error('Space not found')
    }

    const post = await db.post.create({
      data: {
        communityId: community.id,
        workspaceId: ctx.workspace.id,
        spaceId: data.spaceId,
        authorId: member.id,
        title: data.title || null,
        content: data.content,
        type: data.type || 'TEXT',
        mediaIds: JSON.stringify(data.mediaIds || []),
        pollOptions: data.pollOptions ? JSON.stringify(data.pollOptions) : '[]',
        isDraft: data.isDraft || false,
        isScheduled: data.isScheduled || false,
        scheduledAt: data.scheduledAt,
        publishedAt: new Date(),
      },
      include: {
        author: { include: { user: true } },
        space: true,
      },
    })

    await logAuditEvent('community_post.create', {
      userId: ctx.user.id, workspaceId: ctx.workspace.id, resource: 'Post', resourceId: post.id,
    })

    return post
  }

  async updatePost(ctx: RequestContext, id: string, data: {
    title?: string
    content?: string
    spaceId?: string | null
    mediaIds?: string[]
    isPinned?: boolean
    isLocked?: boolean
    isDraft?: boolean
    isScheduled?: boolean
    scheduledAt?: Date | null
  }) {
    await requirePermission(ctx, 'community_post', 'update')
    const post = await db.post.findUnique({ where: { id } })
    if (!post) throw new Error('Post not found')
    if (post.workspaceId !== ctx.workspace.id) throw new Error('Access denied')

    const updateData: Record<string, unknown> = { ...data }
    if ('spaceId' in updateData) updateData.spaceId = data.spaceId ?? undefined

    const updated = await db.post.update({
      where: { id },
      data: updateData as any,
      include: { author: { include: { user: true } }, space: true },
    })

    await logAuditEvent('community_post.update', {
      userId: ctx.user.id, workspaceId: ctx.workspace.id, resource: 'Post', resourceId: id,
    })

    return updated
  }

  async deletePost(ctx: RequestContext, id: string) {
    await requirePermission(ctx, 'community_post', 'delete')
    const post = await db.post.findUnique({ where: { id } })
    if (!post) throw new Error('Post not found')
    if (post.workspaceId !== ctx.workspace.id) throw new Error('Access denied')

    await db.post.delete({ where: { id } })

    await logAuditEvent('community_post.delete', {
      userId: ctx.user.id, workspaceId: ctx.workspace.id, resource: 'Post', resourceId: id,
    })

    return { success: true }
  }

  // ===== Comments =====
  async createComment(ctx: RequestContext, data: {
    postId: string
    parentId?: string
    content: string
  }) {
    await requirePermission(ctx, 'community_comment', 'create')
    const post = await db.post.findUnique({ where: { id: data.postId } })
    if (!post) throw new Error('Post not found')
    if (post.workspaceId !== ctx.workspace.id) throw new Error('Access denied')

    const community = await this.getCommunity(ctx)
    let member = await db.communityMember.findFirst({
      where: { communityId: community.id, userId: ctx.user.id },
    })
    if (!member) {
      member = await db.communityMember.create({
        data: {
          communityId: community.id,
          userId: ctx.user.id,
          workspaceId: ctx.workspace.id,
          role: 'MEMBER',
        },
      })
    }

    if (data.parentId) {
      const parent = await db.comment.findUnique({
        where: { id: data.parentId },
        include: { post: true },
      })
      if (!parent || parent.postId !== post.id) throw new Error('Parent comment not found')
    }

    const comment = await db.comment.create({
      data: {
        postId: post.id,
        communityId: post.communityId,
        workspaceId: ctx.workspace.id,
        authorId: member.id,
        parentId: data.parentId || null,
        content: data.content,
      },
      include: { author: { include: { user: true } } },
    })

    await db.post.update({
      where: { id: post.id },
      data: { commentCount: { increment: 1 } },
    })

    await logAuditEvent('community_comment.create', {
      userId: ctx.user.id, workspaceId: ctx.workspace.id, resource: 'Comment', resourceId: comment.id,
    })

    return comment
  }

  async deleteComment(ctx: RequestContext, id: string) {
    await requirePermission(ctx, 'community_comment', 'delete')
    const comment = await db.comment.findUnique({ where: { id } })
    if (!comment) throw new Error('Comment not found')
    if (comment.workspaceId !== ctx.workspace.id) throw new Error('Access denied')

    // Recursively delete replies
    await db.comment.deleteMany({ where: { parentId: id } })
    await db.comment.delete({ where: { id } })

    await db.post.update({
      where: { id: comment.postId },
      data: { commentCount: { decrement: 1 } },
    })

    await logAuditEvent('community_comment.delete', {
      userId: ctx.user.id, workspaceId: ctx.workspace.id, resource: 'Comment', resourceId: id,
    })

    return { success: true }
  }

  // ===== Reactions =====
  async addReaction(ctx: RequestContext, data: {
    postId?: string
    commentId?: string
    type: string
  }) {
    await requirePermission(ctx, 'community_post', 'read')
    const community = await this.getCommunity(ctx)
    let member = await db.communityMember.findFirst({
      where: { communityId: community.id, userId: ctx.user.id },
    })
    if (!member) {
      member = await db.communityMember.create({
        data: {
          communityId: community.id,
          userId: ctx.user.id,
          workspaceId: ctx.workspace.id,
          role: 'MEMBER',
        },
      })
    }

    const target = data.postId
      ? await db.post.findUnique({ where: { id: data.postId }, include: { community: true } })
      : await db.comment.findUnique({ where: { id: data.commentId! }, include: { post: { include: { community: true } } } })

    if (!target) throw new Error('Post or comment not found')
    const communityId = data.postId ? (target as any).communityId : (target as any).post.communityId
    if ((target as any).workspaceId !== ctx.workspace.id) throw new Error('Access denied')

    const existing = await db.reaction.findFirst({
      where: {
        OR: [{ postId: data.postId }, { commentId: data.commentId }],
        userId: member.id,
      },
    })

    if (existing) {
      if (existing.type === data.type) {
        await db.reaction.delete({ where: { id: existing.id } })
      } else {
        await db.reaction.update({ where: { id: existing.id }, data: { type: data.type } })
      }
    } else {
      await db.reaction.create({
        data: {
          communityId: communityId,
          workspaceId: ctx.workspace.id,
          userId: member.id,
          postId: data.postId || null,
          commentId: data.commentId || null,
          type: data.type,
        },
      })
    }

    return { success: true }
  }

  async getReactionCounts(ctx: RequestContext, postId: string) {
    const post = await db.post.findUnique({ where: { id: postId } })
    if (!post || post.workspaceId !== ctx.workspace.id) throw new Error('Post not found')

    const counts = await db.reaction.groupBy({
      by: ['type'],
      where: { postId },
      _count: { _all: true },
    })

    return counts.reduce<Record<string, number>>((acc, c) => {
      acc[c.type] = c._count._all
      return acc
    }, {})
  }

  // ===== Spaces =====
  async listSpaces(ctx: RequestContext) {
    await requirePermission(ctx, 'community_post', 'read')
    const community = await this.getCommunity(ctx)
    return await db.communitySpace.findMany({
      where: { communityId: community.id },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { members: true, posts: true } } },
    })
  }

  async createSpace(ctx: RequestContext, data: {
    name: string
    slug: string
    description?: string
    iconUrl?: string
    bannerUrl?: string
    color?: string
    privacy?: string
    rules?: string
  }) {
    await requirePermission(ctx, 'community_post', 'manage')
    const community = await this.getCommunity(ctx)

    const space = await db.communitySpace.create({
      data: {
        communityId: community.id,
        workspaceId: ctx.workspace.id,
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        color: data.color || '#2563eb',
        privacy: data.privacy || 'PUBLIC',
        rules: data.rules || '',
      },
    })

    await logAuditEvent('community_space.create', {
      userId: ctx.user.id, workspaceId: ctx.workspace.id, resource: 'CommunitySpace', resourceId: space.id,
    })

    return space
  }

  async updateSpace(ctx: RequestContext, id: string, data: Record<string, any>) {
    await requirePermission(ctx, 'community_post', 'manage')
    const space = await db.communitySpace.findUnique({ where: { id } })
    if (!space || space.workspaceId !== ctx.workspace.id) throw new Error('Space not found')

    const updated = await db.communitySpace.update({ where: { id }, data })

    await logAuditEvent('community_space.update', {
      userId: ctx.user.id, workspaceId: ctx.workspace.id, resource: 'CommunitySpace', resourceId: id,
    })

    return updated
  }

  // ===== Events =====
  async listEvents(ctx: RequestContext, params: { upcoming?: boolean } = {}) {
    await requirePermission(ctx, 'community_post', 'read')
    const community = await this.getCommunity(ctx)

    const where: any = { communityId: community.id }
    if (params.upcoming) where.startsAt = { gte: new Date() }

    return await db.communityEvent.findMany({
      where,
      orderBy: { startsAt: 'asc' },
      include: {
        organizer: { include: { user: true } },
        space: true,
        _count: { select: { attendees: true } },
      },
    })
  }

  async createEvent(ctx: RequestContext, data: {
    spaceId?: string
    title: string
    description: string
    location: string
    meetingUrl?: string
    startsAt: Date
    endsAt: Date
    type?: string
    maxAttendees?: number
    waitlistEnabled?: boolean
  }) {
    await requirePermission(ctx, 'community_post', 'create')
    const community = await this.getCommunity(ctx)

    let member = await db.communityMember.findFirst({
      where: { communityId: community.id, userId: ctx.user.id },
    })
    if (!member) {
      member = await db.communityMember.create({
        data: {
          communityId: community.id,
          userId: ctx.user.id,
          workspaceId: ctx.workspace.id,
          role: 'MEMBER',
        },
      })
    }

    const event = await db.communityEvent.create({
      data: {
        communityId: community.id,
        workspaceId: ctx.workspace.id,
        spaceId: data.spaceId || null,
        organizerId: member.id,
        title: data.title,
        description: data.description,
        location: data.location,
        meetingUrl: data.meetingUrl || null,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        type: data.type || 'MEETUP',
        maxAttendees: data.maxAttendees,
        waitlistEnabled: data.waitlistEnabled || false,
      },
    })

    await logAuditEvent('community_event.create', {
      userId: ctx.user.id, workspaceId: ctx.workspace.id, resource: 'CommunityEvent', resourceId: event.id,
    })

    return event
  }

  async rsvpEvent(ctx: RequestContext, eventId: string, status: string) {
    await requirePermission(ctx, 'community_post', 'read')
    const event = await db.communityEvent.findUnique({ where: { id: eventId } })
    if (!event || event.workspaceId !== ctx.workspace.id) throw new Error('Event not found')

    const community = await this.getCommunity(ctx)
    let member = await db.communityMember.findFirst({
      where: { communityId: community.id, userId: ctx.user.id },
    })
    if (!member) {
      member = await db.communityMember.create({
        data: {
          communityId: community.id,
          userId: ctx.user.id,
          workspaceId: ctx.workspace.id,
          role: 'MEMBER',
        },
      })
    }

    await db.communityEventAttendee.upsert({
      where: { eventId_userId: { eventId, userId: ctx.user.id } },
      create: {
        eventId,
        communityId: event.communityId,
        workspaceId: ctx.workspace.id,
        userId: ctx.user.id,
        status,
      },
      update: { status },
    })

    return { success: true }
  }

  // ===== Invitations =====
  async createInvitation(ctx: RequestContext, data: {
    email: string
    role?: string
    spaceId?: string
  }) {
    await requirePermission(ctx, 'community_member', 'manage')
    const community = await this.getCommunity(ctx)

    let inviter = await db.communityMember.findFirst({
      where: { communityId: community.id, userId: ctx.user.id },
    })
    if (!inviter) {
      inviter = await db.communityMember.create({
        data: {
          communityId: community.id,
          userId: ctx.user.id,
          workspaceId: ctx.workspace.id,
          role: ctx.user.role === 'OWNER' ? 'OWNER' : 'ADMIN',
        },
      })
    }

    const token = Buffer.from(`${ctx.user.id}:${Date.now()}:${data.email}`).toString('base64')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const invitation = await db.communityInvitation.create({
      data: {
        communityId: community.id,
        workspaceId: ctx.workspace.id,
        inviterId: inviter.id,
        inviteeEmail: data.email,
        role: data.role || 'MEMBER',
        spaceId: data.spaceId || null,
        token,
        expiresAt,
      },
    })

    await logAuditEvent('community_invite.create', {
      userId: ctx.user.id, workspaceId: ctx.workspace.id, resource: 'CommunityInvitation', resourceId: invitation.id,
    })

    return invitation
  }

  async listInvitations(ctx: RequestContext) {
    await requirePermission(ctx, 'community_member', 'manage')
    const community = await this.getCommunity(ctx)
    return await db.communityInvitation.findMany({
      where: { communityId: community.id },
      include: { inviter: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  // ===== Badges =====
  async awardBadge(ctx: RequestContext, data: {
    userId: string
    badgeId: string
    reason?: string
  }) {
    await requirePermission(ctx, 'community_member', 'manage')
    const community = await this.getCommunity(ctx)

    const badge = await db.communityBadge.findUnique({
      where: { id: data.badgeId },
    })
    if (!badge || badge.communityId !== community.id) throw new Error('Badge not found')

    const userBadge = await db.communityUserBadge.create({
      data: {
        badgeId: data.badgeId,
        communityId: community.id,
        workspaceId: ctx.workspace.id,
        userId: data.userId,
        awardedBy: ctx.user.id,
        reason: data.reason || '',
      },
    })

    await logAuditEvent('community_badge.award', {
      userId: ctx.user.id, workspaceId: ctx.workspace.id, resource: 'CommunityUserBadge', resourceId: userBadge.id,
    })

    return userBadge
  }

  async listBadges(ctx: RequestContext) {
    await requirePermission(ctx, 'community_post', 'read')
    const community = await this.getCommunity(ctx)
    return await db.communityBadge.findMany({
      where: { communityId: community.id },
      include: { _count: { select: { awardedTo: true } } },
    })
  }

  // ===== Notifications =====
  async listNotifications(ctx: RequestContext, params: { unreadOnly?: boolean } = {}) {
    const where: any = { userId: ctx.user.id, workspaceId: ctx.workspace.id }
    if (params.unreadOnly) where.isRead = false

    return await db.communityNotification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { post: true },
      take: 50,
    })
  }

  async markNotificationRead(ctx: RequestContext, id: string) {
    await db.communityNotification.update({
      where: { id, workspaceId: ctx.workspace.id },
      data: { isRead: true },
    })
    return { success: true }
  }

  async createNotification(ctx: RequestContext, data: {
    userId: string
    type: string
    title: string
    body?: string
    postId?: string
    link?: string
  }) {
    const community = await this.getCommunity(ctx)
    await db.communityNotification.create({
      data: {
        communityId: community.id,
        workspaceId: ctx.workspace.id,
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body || '',
        postId: data.postId || null,
        link: data.link || null,
      },
    })
    return { success: true }
  }

  // ===== Reports =====
  async createReport(ctx: RequestContext, data: {
    postId?: string
    commentId?: string
    reason: string
    description?: string
  }) {
    await requirePermission(ctx, 'community_post', 'read')
    const community = await this.getCommunity(ctx)

    let member = await db.communityMember.findFirst({
      where: { communityId: community.id, userId: ctx.user.id },
    })
    if (!member) {
      member = await db.communityMember.create({
        data: {
          communityId: community.id,
          userId: ctx.user.id,
          workspaceId: ctx.workspace.id,
          role: 'MEMBER',
        },
      })
    }

    const report = await db.communityReport.create({
      data: {
        communityId: community.id,
        workspaceId: ctx.workspace.id,
        reporterId: member.id,
        postId: data.postId || null,
        commentId: data.commentId || null,
        reason: data.reason,
        description: data.description || '',
      },
    })

    await logAuditEvent('community_report.create', {
      userId: ctx.user.id, workspaceId: ctx.workspace.id, resource: 'CommunityReport', resourceId: report.id,
    })

    return report
  }

  async listReports(ctx: RequestContext, status?: string) {
    await requirePermission(ctx, 'community_post', 'manage')
    const community = await this.getCommunity(ctx)

    const where: any = { communityId: community.id }
    if (status) where.status = status

    return await db.communityReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { include: { user: true } },
        post: true,
        comment: true,
      },
    })
  }

  async updateReport(ctx: RequestContext, id: string, data: { status?: string }) {
    await requirePermission(ctx, 'community_post', 'manage')
    return await db.communityReport.update({
      where: { id },
      data: {
        ...data,
        resolvedAt: data.status ? new Date() : undefined,
      },
    })
  }

  // ===== Resources =====
  async listResources(ctx: RequestContext) {
    await requirePermission(ctx, 'community_post', 'read')
    const community = await this.getCommunity(ctx)
    return await db.communityResource.findMany({
      where: { communityId: community.id },
      orderBy: { createdAt: 'desc' },
      include: { author: { include: { user: true } } },
    })
  }

  // ===== Announcements =====
  async listAnnouncements(ctx: RequestContext) {
    await requirePermission(ctx, 'community_post', 'read')
    const community = await this.getCommunity(ctx)
    return await db.communityAnnouncement.findMany({
      where: {
        communityId: community.id,
        OR: [
          { AND: [{ startsAt: null }, { endsAt: null }] },
          { AND: [{ startsAt: { lte: new Date() } }, { OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] }] },
        ],
      },
      orderBy: [{ isPinned: 'desc' }, { startsAt: 'desc' }],
      include: { author: { include: { user: true } } },
    })
  }

  async createAnnouncement(ctx: RequestContext, data: {
    title: string
    content: string
    isPinned?: boolean
    startsAt?: Date
    endsAt?: Date
  }) {
    await requirePermission(ctx, 'community_post', 'manage')
    const community = await this.getCommunity(ctx)

    let member = await db.communityMember.findFirst({
      where: { communityId: community.id, userId: ctx.user.id },
    })
    if (!member) {
      member = await db.communityMember.create({
        data: {
          communityId: community.id,
          userId: ctx.user.id,
          workspaceId: ctx.workspace.id,
          role: 'OWNER',
        },
      })
    }

    const announcement = await db.communityAnnouncement.create({
      data: {
        communityId: community.id,
        workspaceId: ctx.workspace.id,
        authorId: member.id,
        title: data.title,
        content: data.content,
        isPinned: data.isPinned || false,
        startsAt: data.startsAt || null,
        endsAt: data.endsAt || null,
      },
    })

    return announcement
  }
}

export const communityService = new CommunityService()