import got from 'got'

class Requests {
    static async get (url, headers = {}, responseType = 'json') {
        try {
            const response = await got.get(url, {
                headers,
                responseType
            })
            return response && response.body
        } catch (error) {
            WRITE.error(error.stack)
            WRITE.error(error.response.body)
            WRITE.error(error.response.body?._embedded?.errors || error.message)
            return error.response.body || error.message
        }
    }

    static async post (url, jsonData, responseType = 'json', headers = null) {
        try {
            const response = await got.post(url, {
                json:jsonData,
                ...(headers),
                responseType
            })
            return response && response.body
        } catch (error) {
            WRITE.error(error.stack)
            WRITE.error(error.response.body)
            WRITE.error(error.response.body?._embedded?.errors || error.message)
            return error.response.body || error.message
        }
    }

    static async put (url, jsonData, responseType = 'json', headers = null) {
        try {
            const response = await got.put(url, {
                jsonData,
                ...(headers),
                responseType
            })
            return response && response.body
        } catch (error) {
            WRITE.error(error.stack)
            WRITE.error(error.response.body)
            WRITE.error(error.response.body?._embedded?.errors || error.message)
            return error.response.body || error.message
        }
        
    }

    static async delete (url, responseType = 'json', headers = null) {
        try {
            const response = await got.delete(url, {
                ...(headers),
                responseType
            })
            return response && response.body
        } catch (error) {
            WRITE.error(error.stack)
            WRITE.error(error.response.body)
            WRITE.error(error.response.body?._embedded?.errors || error.message)
            return error.response.body || error.message
        }
    }
}

export default Requests
