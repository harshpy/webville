const Users = require('../schema/models/users')
const BaseController = require('./base-controller');
const jwt = require('jsonwebtoken');
const emailValidator = require('email-validator');
const bcrypt = require('bcrypt')
const saltRounds = 10;

module.exports = class ServiceController extends BaseController {
    constructor() {
        super(Users)
        this.Model = Users;
    }

    async _validate(options) {
        const dto = options.body;
        const ve = [];
        if (!this._validString(dto.name, 255))
            ve.push(`name must be valid string and less than 255 characters.`)

        if (!this._validString(dto.phoneNumber, 15))
            ve.push(`phone number must be valid string and less than 15 characters.`)

        if (!this._validString(dto.email, 255))
            ve.push('email must be a valid string and less than 255 characters.')
        else if (!emailValidator.validate(dto.email))
            ve.push('Invalid email')

        if (options.op == BaseController.CREATE_OP && (!dto.password || typeof dto.password != 'string' || dto.password?.length < 8))
            ve.push('password must be a valid string and should consist of atleast 8 characters.')
        else if (options.op == BaseController.UPDATE_OP && dto.hasOwnProperty('password') && (!dto.password || typeof dto.password != 'string' || dto.password?.length < 8))
            ve.push('password must be a valid string and should consist of atleast 8 characters.')

        if(!ve.length){
            const existingUser = await this.Model.forge({email : dto.email}).fetch();
            if(existingUser)
                ve.push('email already exists.')
        }

        return ve;
    }

    async login(req, res) {
        const options = await this.formatReq(req)
        const body = options.body
        if (body.email && body.password) {
            let user = await this.Model.forge({ email: body.email }).fetch();
            if (user) {
                user = user.toJSON();
                const passwordMatch = await bcrypt.compare(body.password, user.password);
                if (passwordMatch) {
                    const accessToken = await this.generateJWToken(user)
                    if (accessToken) {
                        const dtoUser = {
                            username: user.email,
                            id: user.id,
                            accessToken,
                            issuedAt: new Date()
                        }
                        return res.status(200).json({
                            message: 'Login Successful!',
                            statusCode: 200,
                            dtoUser
                        })
                    }
                }
                else {
                    return res.json({
                        statusCode: 401,
                        message: 'Incorrect password'
                    })
                }
            }
        }
    }

    async generateJWToken(userInfo) {
        try {
            return await jwt.sign({ userInfo }, process.env.JWT_SECRET_KEY, { expiresIn: '8h' });
        } catch (err) {
            console.error("Error while generating token: ", err);
            return res.status(500).json({
                statusCode: 500,
                message: 'Internal Server error'
            });
        }
    }

    _validString(data, length) {
        if (!data || typeof data != 'string')
            return false;
        else if (data.length > length)
            return false;
        return true;
    }

    async _mapToDBObj(options) {
        const obj = options.obj;
        const dto = options.body;
        if (dto.email)
            obj.set('email', dto.email);
        if (dto.name)
            obj.set('name', dto.name);
        if (dto.password)
            obj.set('password', await bcrypt.hash(dto.password, saltRounds));
        if (dto.phoneNumber)
            obj.set('phoneNumber', dto.phoneNumber);

        return obj;
    }

    async _mapToUserObj(obj) {
        obj = obj.toJSON({ omitPivot: true, hidden: ['password'] });
        return obj
    }
}