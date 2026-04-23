const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const tokenBlacklistModel = require("../models/blacklist.model");

/**
 * @name registerUserController
 * @description Register a new user
 * @access Public
 */
async function registerUserController(req, res) {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Please provide username, email and password",
            });
        }

        const isUserAlreadyExists = await userModel.findOne({
            $or: [{ username }, { email }],
        });

        if (isUserAlreadyExists) {
            return res.status(400).json({
                message: "Account already exists with this email address or username",
            });
        }

        const hash = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username,
            email,
            password: hash,
        });

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: false, // production me true karna if using https
        });

        return res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("REGISTER ERROR:", error);
        return res.status(500).json({
            message: "Internal server error during registration",
        });
    }
}

/**
 * @name loginUserController
 * @description Login a user
 * @access Public
 */
async function loginUserController(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please provide email and password",
            });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password",
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Invalid email or password",
            });
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: "lax",
            secure: false, // production me true karna if using https
        });

        return res.status(200).json({
            message: "User logged in successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        return res.status(500).json({
            message: "Internal server error during login",
        });
    }
}

/**
 * @name logoutUserController
 * @description Clear token from cookie and blacklist it
 * @access Public
 */
async function logoutUserController(req, res) {
    try {
        const token = req.cookies?.token;

        if (token) {
            await tokenBlacklistModel.create({ token });
        }

        res.clearCookie("token");

        return res.status(200).json({
            message: "User logged out successfully",
        });
    } catch (error) {
        console.error("LOGOUT ERROR:", error);
        return res.status(500).json({
            message: "Internal server error during logout",
        });
    }
}

/**
 * @name getMeController
 * @description Get current logged in user
 * @access Private
 */
async function getMeController(req, res) {
    try {
        const user = await userModel.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        return res.status(200).json({
            message: "User details fetched successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("GET ME ERROR:", error);
        return res.status(500).json({
            message: "Internal server error while fetching user details",
        });
    }
}

module.exports = {
    registerUserController,
    loginUserController,
    logoutUserController,
    getMeController,
};