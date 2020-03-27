const gravatar = require('gravatar');
const User = require('../models/User')

const createUser = async (name, email) => {
    let user = await User.findOne({ email });

    if (user) {
        throw new Error('User already exists');
    }

    const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm'
    });

    user = new User({
        name,
        email,
        avatar
    });

    return await user.save();
};

exports.createUser = createUser;
