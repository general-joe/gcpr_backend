import dotenv from 'dotenv'
import compression from 'compression'
import express from 'express'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import morgan from 'morgan'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

// Global Variables
import WRITE from './utils/logger.js'

import CONSTANTS from './utils/constants.js'
import MOMENT from 'moment'
import _ from 'lodash'
import gcprError from './utils/http-error.js'
import router from './routes/index.route.js'
import swaggerUi from 'swagger-ui-express'
import swaggerSpec from './config/swagger.js'

// ROUTING

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config()

const app = express()

global.WRITE = WRITE
global.CONSTANTS = CONSTANTS
global.MOMENT = MOMENT
global._ = _
global.gcprError = gcprError



app.use(compression())
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser())
app.use(express.static(path.join(__dirname, './files')))
app.use(morgan("dev"));

// Serve Swagger docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.get('/docs.json', (req, res) => res.json(swaggerSpec))

app.use(router)




app.get('/', (req, res) => {
    res.send({
        status: 'ok',
        env: process.env.NODE_ENV,
        date: MOMENT(),
        visitor: req.ip,
        version: 1.0
    })
})

app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true
}))

app.use(cors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTION',
    credentials: true,
    exposedHeaders: ['x-auth-token']
}))

app.use(bodyParser.json({
    limit: '50mb',
    extended: true
}))

app.use((err, req, res, next) => {
  // Known HTTP errors (your custom errors)
  if (err instanceof gcprError) {
    return res.status(err.status || 400).json({
      status: err.status || 400,
      message: err.message,
    });
  }

  // Prisma errors
  if (err?.name?.includes('Prisma')) {
    return res.status(500).json({
      status: 500,
      message: 'Database error',
    });
  }

  // Fallback (unknown errors)
  return res.status(500).json({
    status: 500,
    message: err.message || 'Internal server error',
  });
});




export default app