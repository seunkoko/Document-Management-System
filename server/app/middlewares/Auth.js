import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import db from '../../app/models/index';
import Helper from '../Helper/Helper';

dotenv.config();

const secretKey = process.env.SECRETKEY;

const Auth = {
  /**
   * Varify user token
   * @param {Object} req request object
   * @param {Object} res response object
   * @param {Object} next move to next controller handler
   * @returns {void} no returns
   */
  verifyToken(req, res, next) {
    const token = req.headers['x-access-token'];
    if (token) {
      jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
          return res.status(401)
            .send({
              message: 'The token you supplied has expired'
            });
        }
        db.User.findById(decoded.userId)
          .then((user) => {
            if (!user) {
              return res.status(404)
                .send({
                  message: 'Account not found, Sign Up or sign in to get access'
                });
            }
            if (!user.active) {
              return res.status(401)
                .send({
                  message: 'Please sign in to access your account'
                });
            }
            req.tokenDecode = decoded;
            req.tokenDecode.roleId = user.roleId;
            next();
          });
      });
    } else {
      res.status(400)
        .send({
          message: 'Please sign in or register to get a token'
        });
    }
  },
  getToken(user) {
    const userToken = jwt.sign({
      userId: user.id
    },
      secretKey, { expiresIn: '7d' }
    );
    return userToken;
  },
  /**
   * Validate user's input
   * @param {Object} req req object
   * @param {Object} res response object
   * @param {Object} next Move to next controller handler
   * @returns {void|Object} response object or void
   * */
  validateUserInput(req, res, next) {
    if (req.body.rolesId && req.body.rolesId === 1) {
      return res.status(403)
        .send({
          message: 'Permission denied, You cannot sign up as an admin user'
        });
    }
    let username = /\w+/g.test(req.body.username);
    let firstName = /\w+/g.test(req.body.firstName);
    let lastName = /\w+/g.test(req.body.lastName);
    let email = /\S+@\S+\.\S+/.test(req.body.email);
    let password = /\w+/g.test(req.body.password);

    if (!username) {
      return res.status(400)
        .send({
          message: 'Enter a valid username'
        });
    }
    if (!firstName) {
      return res.status(400)
        .send({
          message: 'Enter a valid firstname'
        });
    }
    if (!lastName) {
      return res.status(400)
        .send({
          message: 'Enter a valid lastname'
        });
    }
    if (!email) {
      return res.status(400)
        .send({
          message: 'Enter a valid email'
        });
    }
    if (!password) {
      return res.status(400)
        .send({
          message: 'Enter a valid password'
        });
    }
    if (req.body.password && req.body.password.length < 8) {
      return res.status(400)
        .send({
          message: 'Minimum of 8 characters is allowed for password'
        });
    }

    db.User.findOne({ where: { email: req.body.email } })
      .then((user) => {
        if (user) {
          return res.status(409)
            .send({
              message: 'email already exists'
            });
        }
        db.User.findOne({ where: { username: req.body.username } })
          .then((newUser) => {
            if (newUser) {
              return res.status(409)
                .send({
                  message: 'username already exists'
                });
            }
            username = req.body.username;
            firstName = req.body.firstName;
            lastName = req.body.lastName;
            email = req.body.email;
            password = req.body.password;
            const rolesId = req.body.roleId || 2;
            req.userInput =
            { username, firstName, lastName, rolesId, email, password };
            next();
          });
      });
  },
  /**
   * Validate user's login datas
   * @param {Object} req req object
   * @param {Object} res response object
   * @param {Object} next Move to next controller handler
   * @returns {void|Object} response object or void
   * */
  validateLoginInput(req, res, next) {
    if (!req.body.password || !req.body.email) {
      return res.status(400)
        .send({
          message: 'Please provide your email and password to login'
        });
    }

    const email = /\S+@\S+\.\S+/.test(req.body.email);
    const password = /\w+/g.test(req.body.password);

    if (!email || !password) {
      return res.status(400)
        .send({
          message: 'Please enter a valid email and password'
        });
    }
    next();
  },
  /**
   * Validate search
   * @param {Object} req req object
   * @param {Object} res response object
   * @param {Object} next Move to next controller handler
   * @returns {void|Object} response object or void
   *
   */
  validateSearch(req, res, next) {
    const query = {};
    const terms = [];
    const userQuery = req.query.query;
    const searchArray =
      userQuery ? userQuery.toLowerCase().match(/\w+/g) : null;
    const limit = req.query.limit || 10;
    const offset = req.query.offset || 0;
    const publishedDate = req.query.publishedDate;
    const order =
      publishedDate && publishedDate === 'ASC' ? publishedDate : 'DESC';

    if (limit < 0 || !/^([1-9]\d*|0)$/.test(limit)) {
      return res.status(400)
        .send({
          message: 'Only positive number is allowed for limit value'
        });
    }
    if (offset < 0 || !/^([1-9]\d*|0)$/.test(offset)) {
      return res.status(400)
        .send({
          message: 'Only positive number is allowed for offset value'
        });
    }

    if (searchArray) {
      searchArray.forEach((word) => {
        terms.push(`%${word}%`);
      });
    }
    query.limit = limit;
    query.offset = offset;
    query.order = [['createdAt', order]];

    if (`${req.baseUrl}${req.route.path}` === '/users/search') {
      if (!req.query.query) {
        return res.status(400)
          .send({
            message: 'Please enter a search query'
          });
      }
      query.where = {
        $or: [
          { username: { $iLike: { $any: terms } } },
          { firstName: { $iLike: { $any: terms } } },
          { lastName: { $iLike: { $any: terms } } },
          { email: { $iLike: { $any: terms } } }
        ]
      };
    }
    if (`${req.baseUrl}${req.route.path}` === '/users/') {
      query.where = Helper.isAdmin(req.tokenDecode.rolesId)
        ? {}
        : { id: req.tokenDecode.userId };
    }
    if (`${req.baseUrl}${req.route.path}` === '/documents/search') {
      if (!req.query.query) {
        return res.status(400)
          .send({
            message: 'Please enter a search query'
          });
      }
      if (Helper.isAdmin(req.tokenDecode.rolesId)) {
        query.where = Helper.likeSearch(terms);
      } else {
        query.where = {
          $and: [Helper.docAccess(req), Helper.likeSearch(terms)]
        };
      }
    }
    if (`${req.baseUrl}${req.route.path}` === '/documents/') {
      if (Helper.isAdmin(req.tokenDecode.rolesId)) {
        query.where = {};
      } else {
        query.where = Helper.docAccess(req);
      }
    }
    if (`${req.baseUrl}${req.route.path}` === '/users/:id/documents') {
      const adminSearch = req.query.query ? Helper.likeSearch(terms) : { };
      const userSearch = req.query.query
        ? [Helper.docAccess(req), Helper.likeSearch(terms)]
        : Helper.docAccess(req);
      if (Helper.isAdmin(req.tokenDecode.roleId)) {
        query.where = adminSearch;
      } else {
        query.where = userSearch;
      }
    }
    req.dmsFilter = query;
    next();
  },
  /**
   * Get a single user's profile
   * @param {Object} req req object
   * @param {Object} res response object
   * @param {Object} next Move to next controller handler
   * @returns {void|Object} response object or void
   */
  getSingleUser(req, res, next) {
    db.User
      .findOne({
        where: { id: req.params.id },
      })
      .then((user) => {
        if (!user) {
          return res.status(404)
            .send({
              message: 'This user does not exist'
            });
        }
        req.getUser = user;
        next();
      })
      .catch(err => res.status(500).send(err.errors));
  },
  /**
   * Get a single user's profile
   * @param {Object} req req object
   * @param {Object} res response object
   * @param {Object} next Move to next controller handler
   * @returns {void|Object} response object or void
   */
  getUserName(req, res, next) {
    db.User
      .findOne({
        where: { username: req.query.q },
      })
      .then((user) => {
        if (!user) {
          return res.status(404)
            .send({
              message: 'This user does not exist'
            });
        }
        req.getUser = user;
        next();
      })
      .catch(err => res.status(500).send(err.errors));
  },
  /**
   * Validate user's input
   * @param {Object} req req object
   * @param {Object} res response object
   * @param {Object} next Move to next controller handler
   * @returns {void|Object} response object or void
   * */
  validateUserUpdate(req, res, next) {
    if (!(Helper.isAdmin(req.tokenDecode.rolesId) || Helper.isOwner(req))) {
      return res.status(401)
        .send({
          message: 'You are not permitted to update this profile'
        });
    }
    if (!!req.body.rolesId && req.body.rolesId === '1') {
      if (!Helper.isAdmin(req.tokenDecode.rolesId)) {
        return res.status(403)
          .send({
            message: 'You are not permitted to update role to admin'
          });
      }
    }
    if (req.body.id) {
      return res.status(403)
        .send({
          message: 'You are not permitted to update your id'
        });
    }
    db.User.findById(req.params.id)
      .then((user) => {
        if (!user) {
          return res.status(404)
            .send({
              message: 'This user does not exist'
            });
        }
        req.userInstance = user;
        next();
      });
  },
  /**
   * Check for admin permission
   * @param {Object} req request object
   * @param {Object} res response object
   * @param {Object} next move to next controller handler
   * @returns {Object} Object
   */
  hasAdminPermission(req, res, next) {
    db.User
      .findById(req.tokenDecode.userId)
      .then((user) => {
        if (user.rolesId === 1) {
          next();
        } else {
          return res.status(403)
            .send({
              message: 'You are not permitted to perform this action'
            });
        }
      });
  },
  /**
   * Validate user to delete, make sure it not admin user
   * @param {Object} req req object
   * @param {Object} res response object
   * @param {Object} next Move to next controller handler
   * @returns {void|Object} response object or void
   *
   */
  validateDeleteUser(req, res, next) {
    db.User.findById(req.params.id)
      .then((user) => {
        if (!user) {
          return res.status(404)
            .send({
              message: 'This user does not exist'
            });
        }
        req.userInstance = user;
        next();
      });
  },
};

export default Auth;
