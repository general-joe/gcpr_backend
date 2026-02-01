import HTTPStatus from './http-status.js'
import ResponseCodes from './responseCodes.js'
import jwt from 'jsonwebtoken'
import randToken from 'rand-token'

class UtilFunctions {
    static outputError (res, message = 'An error occurred', data = {},
        responseCode = ResponseCodes.FAILED, statusCode = HTTPStatus.BAD_REQUEST) {
        res.status(statusCode).json({
            status: responseCode,
            data: UtilFunctions._clearNulls({ ...data, ...(res.locals.user && { user: res.locals.user.id }) }),
            message
        })
    }

    static outputDetailedError (res, error, responseCode = ResponseCodes.FAILED, statusCode = HTTPStatus.BAD_REQUEST) {
        res.status(error.statusCode || statusCode).json({
            status: error.responseCode || responseCode,
            data: { ...error.data, ...(res.locals.user && { user: res.locals.user.id }) },
            message: error.constraint ? error.detail : error.message
        })
    }

    static outputSuccess (res, data = {}, message = 'Completed successfully', statusCode = HTTPStatus.OK) {
        res.status(statusCode).json({
            status: ResponseCodes.SUCCESS,
            data: UtilFunctions._clearNulls(data.data || data),
            pagination: data.pagination,
            message
        })
    }

    static _clearNulls (data, clearEmptyStrings = false) {
        let fileKeys
        if (_.isArray(data)) {
            data.forEach(d => this._clearNulls(d))
            return data
        } else {
            fileKeys = Object.keys(data)
        }
        fileKeys.forEach((key) => {
            if (data[key] === null || (clearEmptyStrings && data[key] === '')) {
                delete data[key]
            } else if (typeof data[key] === 'object') {
                data[key] = UtilFunctions._clearNulls(data[key])
            }
        })

        //  Clear unneeded items
        delete data.password
        return data
    }

    static now (daysToAdd = 0) {
        const result = new Date(Date.now())
        const mill = result.setDate(result.getDate() + daysToAdd)
        const d = new Date(mill)
        let mn = d.getMonth() + 1
        if (mn.toString().length === 1) {
            mn = `0${mn}`
        }
        let day_ = d.getDate()
        if (day_.toString().length === 1) {
            day_ = `0${day_}`
        }
        return `${d.getFullYear()}-${mn}-${day_}`
    }

    static genId (length = 20) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let autoId = ''
        for (let i = 0; i < length; i++) {
            autoId += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return autoId
    }

    static round (number, decimalDigits = 0) {
        if (isNaN(number)) {
            return number
        }
        const num = number * 1.0
        return Math.round((num + Number.EPSILON) * Math.pow(10, decimalDigits)) / Math.pow(10, decimalDigits)
    }

    static genOTP (length = 6) {
        const chars = '0123456789'
        let autoId = ''
        for (let i = 0; i < length; i++) {
            autoId += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return autoId
    }

    static generateAccessToken(payload) {
        return jwt.sign(payload, process.env.JWT, {
        algorithm: 'HS256',
        expiresIn: '4h',
    });
    }

    static generateRefreshToken() {
        return randToken.uid(256);
    }

    static verifyAccessToken(token) {
        return jwt.verify(token, process.env.JWT);
    }

    static getLimitOffset (query, keep = true) {
        const limitObj = {
            offset: !query.page ? 0 : (query.page - 1) * (query.limit || 10),
            limit: query.limit || 10,
            page: query.page || 1,
            keyword: query.keyword || '',
            tags: query.tags ? query.tags.split(',') : [],  
            listing_order: !query.listing_order ? 'recent' : query.listing_order,
            ...(query.from && { from: query.from }),
            ...(query.to && { to: query.to })
        }
        delete query.listing_order
        if (!keep) {
            delete query.page
            delete query.limit
            delete query.keyword
            delete query.to
            delete query.tags  
            delete query.from
        }
        return limitObj
    }

    static replaceAll (str, find, replace) {
        return str.replace(new RegExp(find, 'g'), replace)
    }
static normalizeJson(input) {
  if (Array.isArray(input)) {
    // To handle arrays with JSON strings inside
    return input.map(item => {
      if (typeof item === "string") {
        try {
          return JSON.parse(item);
        } catch {
          return item;
        }
      }
      return item;
    }).flat();
  }

  if (typeof input === "string") {
    try {
      return JSON.parse(input);
    } catch {
      return input;
    }
  }

  return input;
}
        static deepNormalizeJson(input) {
        let result = input;

        while (typeof result === 'string') {
            result = result.trim();

            // Break if it no longer starts like a JSON
            if (!/^[\[{"]/.test(result)) break;

            try {
            const parsed = JSON.parse(result);
            result = parsed;
            } catch {
            break;
            }
        }

        return result;
        }

    static safeStringify = (value) => {
        if (typeof value === "string") return value; 
        return JSON.stringify(value);
        };

    static getNamesFromFullName (fullName) {
        const names = fullName.split(' ')
        return {
            first_name: names[0],
            last_name: names[1]
        }
    }
}

export default UtilFunctions