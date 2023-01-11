
const HttpStatusCodes = require('http-status-codes')
const Busboy = require('async-busboy');
const fs = require('fs');
module.exports = class BaseController {

    constructor(Model) {
        this.Model = Model;
    }

    static get READ_OP() {
        return 'r';
    }

    static get CREATE_OP() {
        return 'c';
    }

    static get UPDATE_OP() {
        return 'u';
    }

    static get DELETE_OP() {
        return 'd';
    }

    async getAll(req, res) {
        try {
            const options = await this.formatReq(req);
            options.op = BaseController.READ_OP;
            let dbObjs = await this.Model.forge().getAll(options).fetchAll()
            dbObjs = dbObjs.toJSON()
            return res.status(HttpStatusCodes.OK).send(dbObjs)
        } catch (e) {
            console.error(`error while fetching ${this.Model.prototype.tableName}: ${e}`)
            throw res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        }
    }

    async update(req, res) {
        try {
            const options = await this.formatReq(req);
            options.op = BaseController.UPDATE_OP;
            if (isNaN(parseInt(options.id, 10))) {
                return res.status(HttpStatusCodes.BAD_REQUEST).json(
                    {
                        messages: ['please provide valid id!']
                    })
            }
            const existingObj = await this.Model.forge().getSingle(options).fetch()
            if (existingObj) {
                const validationResults = await this._validate(options)
                if (validationResults.length) {
                    const validationErrors = {
                        messages: [...validationResults]
                    }
                    return res.status(HttpStatusCodes.BAD_REQUEST).json(validationErrors)
                }

                options.obj = existingObj
                let obj = await this._mapToDBObj(options)
                await obj.save();
                obj = await this._mapToUserObj(obj)
                return res.status(HttpStatusCodes.CREATED).json(obj)
            }
            else {
                return res.status(HttpStatusCodes.NOT_FOUND).json({
                    messages: [`${this.Model.prototype.tableName} does not exist!`]
                })
            }
        }
        catch (e) {
            console.error(`error while updating ${this.Model.prototype.tableName}: ${e}`)
            throw res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR)
        }
    }

    async create(req, res) {
        try {
            const options = await this.formatReq(req);
            options.obj = await this._getModel()
            options.op = BaseController.CREATE_OP;
            const validationResults = await this._validate(options)
            if (validationResults.length) {
                const validationErrors = {
                    messages: [...validationResults]
                }
                return res.status(HttpStatusCodes.BAD_REQUEST).json(validationErrors)
            }

            let obj = await this._mapToDBObj(options)
            await obj.save();
            obj = await this._mapToUserObj(obj)
            return res.status(HttpStatusCodes.CREATED).json(obj)
        }
        catch (e) {
            console.error(`error while creating ${this.Model.prototype.tableName}: ${e}`)
            return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send()
        }
    }

    async _mapToUserObj(obj) {
        return obj.toJSON()
    }

    async getSingle(req, res, id = null) {
        try {
            const options = await this.formatReq(req);
            if (id)
                options.id = id
            if (isNaN(parseInt(options.id, 10))) {
                return res.status(HttpStatusCodes.BAD_REQUEST).json(
                    {
                        message: 'please provide valid id!'
                    })
            }
            let dbObj = await this.Model.forge().getSingle(options).fetch()
            if (dbObj) {
                dbObj = await this._mapToUserObj(dbObj)
                return res.status(HttpStatusCodes.OK).send(dbObj)
            }
            else
                return res.status(HttpStatusCodes.NOT_FOUND).send(dbObj)
        } catch (e) {
            console.error(`error while fetching ${this.Model.prototype.tableName}: ${e}`)
            return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).send()
        }
    }

    async delete(req, res, id = null) {
        const options = await this.formatReq(req);
        if (id)
            options.id = id
        if (isNaN(parseInt(options.id, 10))) {
            return res.status(HttpStatusCodes.BAD_REQUEST).json(
                {
                    message: 'please provide valid id!'
                })
        }
        let dbObj = await this.Model.forge().getSingle(options).fetch()
        if (dbObj) {
            await dbObj.destroy();
            return res.status(HttpStatusCodes.OK).send()
        }
        else
            return res.status(HttpStatusCodes.NOT_FOUND).send(dbObj)
    }

    async _validate(options) {
        return Promise.resolve([]);
    }

    async _getModel() {
        return await this.Model.forge();
    }

    async formatReq(req) {
        let fileDto = null
        if (req.headers['content-type'] != 'application/json') {
            fileDto = await Busboy(req)
        }
        return ({
            query: req.query,
            id: req.params.id,
            body: req.body,
            file: fileDto?.files[0]
        })
    }
}