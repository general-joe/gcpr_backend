#!/usr/bin/env node
'use strict'

import dotenv from 'dotenv'
import server from './src/server.js'
import WRITE from './src/utils/logger.js'
import { startCronJobs } from './src/services/cron/index.js'
import { seedFaqs } from './src/utils/faqSeed.js'
dotenv.config()

const port = process.env.PORT || 3000


export default server.listen(port, "0.0.0.0", () => {
    WRITE.info(`Server is started at : 0.0.0.0:${port} `)
    startCronJobs()
    seedFaqs()
})
