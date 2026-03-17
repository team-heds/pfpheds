import authRoutes from './auth'
import pagesRoutes from './pages'
import calendarRoutes from './calendar'
import mediaRoutes from './media'
import profilesRoutes from './profiles'
import adminRoutes from './admin'
import pfpRoutes from './pfp'
import socialRoutes from './social'
import usersRoutes from './users'
import votationsRoutes from './votations'
import appsRoutes from './apps'

export default [
  ...authRoutes,
  ...pagesRoutes,
  ...calendarRoutes,
  ...mediaRoutes,
  ...profilesRoutes,
  ...adminRoutes,
  ...pfpRoutes,
  ...socialRoutes,
  ...usersRoutes,
  ...votationsRoutes,
  ...appsRoutes,
]
