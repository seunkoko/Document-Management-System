/**
 * Controller's' helper
 */
const Helper = {
  /**
   * Check for admin permission
   * @param {String} rolesId user role id
   * @returns {Boolean} true or false
   */
  isAdmin(rolesId) {
    return rolesId === 1;
  },
  /**
   * Check for owner
   * @param {Object} req request object
   * @returns {Boolean} true or false
   */
  isOwner(req) {
    return String(req.tokenDecode.userId) === String(req.params.id);
  },
   /**
   * Get user's profile'
   * @param {Object} data object containing user's details
   * @returns {Object} return user's data
   */
  userProfile(data) {
    return {
      id: data.id,
      username: data.username,
      firstName: data.firstname,
      lastName: data.lastname,
      email: data.email,
      rolesId: data.roleId,
      createAt: data.createdAt,
      updatedAt: data.updatedAt
    };
  },
  /**
   * Get user's profile'
   * @param {Object} data object containing user's details
   * @returns {Object} return user's data
   */
  getUserProfile(data) {
    return {
      id: data.id,
      username: data.username,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
    };
  },
  /**
   * Get user's attributes'
   * @returns {Array} return user's attributes
   */
  getUserAttribute() {
    return [
      'id',
      'username',
      'firstName',
      'lastName',
      'email',
      'createdAt',
    ];
  },
  /**
   * Get document's attributes'
   * @returns {Array} return user's attributes
   */
  getDocAttribute() {
    return [
      'id',
      'title',
      'content',
      'access',
      'ownerId',
      'createdAt',
      'updatedAt'
    ];
  },
  /**
   * Query for document's access
   * @param {Object} req request object
   * @returns {Object} return access query
   */
  docAccess(req) {
    const access = {
      $or:
      [
        { access: 'public' },
        { ownerId: req.tokenDecode.userId },
        {
          $and: [
            { access: 'role' },
            { ownerRoleId: req.tokenDecode.roleId }
          ]
        }
      ]
    };
    return access;
  },
  /**
   * Pagination
   * @param {Object} condition pagination condition
   * @returns {Object} return an object
   */
  pagination(condition) {
    const next = Math.ceil(condition.count / condition.limit);
    const currentPage = Math.floor((condition.offset / condition.limit) + 1);
    const pageSize = condition.limit > condition.count
      ? condition.count : condition.limit;
    return {
      page_count: next,
      page: currentPage,
      page_size: Number(pageSize),
      total_count: condition.count
    };
  },
  /**
   * Get errors
   * @param {Array} error client side errors
   * @returns {Array} return user's attributes
   */
  errorArray(error) {
    const errorArray = [];
    error.errors.forEach((err) => {
      errorArray.push({ path: err.path, message: err.message });
    });
    return errorArray;
  },
};
export default Helper;
