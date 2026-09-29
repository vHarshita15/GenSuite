import express from 'express'
import { createCommunityResource, getCommunityResources } from '../controllers/communityResourceController.js'
import { requireUser } from '../middlewares/requireUser.js'

const communityResourceRouter = express.Router()

communityResourceRouter.get('/', getCommunityResources)
communityResourceRouter.post('/', requireUser, createCommunityResource)

export default communityResourceRouter
