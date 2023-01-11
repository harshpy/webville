const Users = require('../schema/models/users')
const BaseController = require('./base-controller')
const HttpStatusCodes = require('http-status-codes')

module.exports = class ProfilePicController extends BaseController {
    constructor() {
        super(Users)
        this.Model = Users;
    }

    _mapToDBObj(options) {
        const obj = options.obj;
        obj.set('profilePic', options.file._readableState.buffer);

        return obj;
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
            await dbObj.set('profilePic', null)
            await dbObj.save()
            return res.status(HttpStatusCodes.OK).send()
        }
        else
            return res.status(HttpStatusCodes.NOT_FOUND).send(dbObj)
    }

    async _mapToUserObj(obj) {
        obj = obj.toJSON({ omitPivot: true, hidden: ['password'] });
        return obj
    }
}