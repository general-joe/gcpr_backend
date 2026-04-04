#!/usr/bin/env node
'use strict'

import dotenv from 'dotenv'
import server from './src/server.js'
import cron from 'node-cron'
import WRITE from './src/utils/logger.js'
// import CronService from './server/services/cron/CronService.js'
dotenv.config()

// Run every minute to catch exact opening times
// cron.schedule('* * * * *', CronService.reset_Opening_Time)

// //  other cron jobs
// cron.schedule('* * * * *', CronService.clearOldOrders)
// cron.schedule('0 23 * * *', CronService.processScheduledWithdrawals)
// cron.schedule('* * * * *', CronService.clearOldPromotions)

const port = process.env.PORT || 3000


export default server.listen(port, () => {
    WRITE.info(`Server is started at : http://localhost:${port} `)
})

