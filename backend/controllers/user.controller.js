import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";
import bcrypt from "bcryptjs"


export const getUserProfile = async (req, res) => {
    const { username } = req.params;
    // console.log(username)
    try {
        const user = await User.findOne({ username }).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json(user)
    } catch (error) {
        console.log("Error in getUserProfile: ", error.message);
        res.status(500).json({ error: error.message });
    }
}

export const followUnfollowUser = async (req, res) => {
    try {
        const { id } = req.params;
        // console.log(id)
        const userToModify = await User.findById(id);
        // console.log(userToModify)
        const currentUser = await User.findById(req.user._id);
        // console.log(currentUser)  

        if (id === req.user._id.toString()) {
            return res.status(400).json({ error: "You can't follow/unfollow yourself" });
        }

        if (!userToModify || !currentUser) return res.status(400).json({ error: "User not found" });

        const isFollowing = currentUser.following.includes(id);

        if (isFollowing) {
            // Unfollow the user
            await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
            await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });

            res.status(200).json({ message: "User unfollowed successfully" });
        } else {
            // Follow the user
            await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } }); //the person who will be followed by other user has and addition of id in the followers array
            await User.findByIdAndUpdate(req.user._id, { $push: { following: id } }); //the person who will follow other user have and addition of id in the following array
            // Send notification to the user
            const newNotification = new Notification({
                type: "follow",
                from: req.user._id,
                to: userToModify._id
            })

            await newNotification.save();
            res.status(200).json({ message: "User followed successfully" });
        }

    } catch (error) {
        console.log("Error in followUnfollowUser: ", error.message);
        res.status(500).json({ error: error.message });
    }
}

export const getSuggestedUsers = async (req, res) => {
    try {
        const userId = req.user._id;

        const usersFollowedByMe = await User.findById(userId).select("following");
        // console.log(usersFollowedByMe)

        const users = await User.aggregate([
            {
                $match: {
                    _id: { $ne: userId },
                },
            },
            { $sample: { size: 10 } },
        ]);
        // console.log(users)

        // 1,2,3,4,5,6,
        const filteredUsers = users.filter((user) => !usersFollowedByMe.following.includes(user._id));
        const suggestedUsers = filteredUsers.slice(0, 4);

        suggestedUsers.forEach((user) => (user.password = null));

        res.status(200).json(suggestedUsers);
    } catch (error) {
        console.log("Error in getSuggestedUsers: ", error.message);
        res.status(500).json({ error: error.message });
    }
}

export const updateUser = async (req, res) => {
    const { fullName, email, username, currentPassword, newPassword, bio, link } = req.body;
    let { profileImg, coverImg } = req.body;

    const userId = req.user._id;
    try {
        let user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if ((!newPassword && currentPassword) || (!currentPassword && newPassword)) {
            return res.status(400).json({ error: "Please provide both current password and new password" });
        }

        if (currentPassword && newPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            // console.log(isMatch)
            if (!isMatch) return res.status(400).json({ error: "Current password is incorrect" });
            if (newPassword.length < 6) {
                return res.status(400).json({ error: "Password must be at least 6 characters long" });
            }


            user.password = await bcrypt.hash(newPassword, 10);
        }
        if (profileImg) {
            if (user.profileImg) {
                // https://res.cloudinary.com/dyfqon1v6/image/upload/v1712997552/zmxorcxexpdbh8r0bkjb.png
                await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]); //It will first split this by / and then because of pop() it will get the last one and then split that with . and take the first value from two split values
            }
            const uploadedImg = await cloudinary.uploader.upload(profileImg);
            console.log(uploadedImg)
            profileImg = uploadedImg.secure_url;

        }
        if (coverImg) {
            if (user.coverImg) {
                await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
            }
            const uploadedImg = await cloudinary.uploader.upload(coverImg);
            console.log(uploadedImg)
            coverImg = uploadedImg.secure_url;
        }
        user.fullName = fullName || user.fullName;
        user.email = email || user.email;
        user.username = username || user.username;
        user.bio = bio || user.bio;
        user.link = link || user.link;
        user.profileImg = profileImg || user.profileImg;
        user.coverImg = coverImg || user.coverImg;

        user = await user.save();

        // password should be null in response
        user.password = null;

        return res.status(200).json(user);

    } catch (error) {
        console.log("Error in updateUser: ", error.message);
        res.status(500).json({ error: error.message });
    }
}