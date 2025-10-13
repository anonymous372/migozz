import { API_RESPONSE } from "../utils/constants.js";
import User from "../models/User.js";

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password");

    res
      .status(200)
      .json(
        API_RESPONSE(200, { user }, null, "User profile retrieved successfully")
      );
  } catch (error) {
    console.error("Get user profile error:", error);
    res
      .status(500)
      .json(
        API_RESPONSE(
          500,
          null,
          "Internal Server Error",
          "Failed to get user profile"
        )
      );
  }
};

// Update user online status
export const updateOnlineStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { isOnline } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        isOnline,
        lastSeen: new Date(),
      },
      { new: true }
    ).select("-password");

    res
      .status(200)
      .json(
        API_RESPONSE(200, { user }, null, "Online status updated successfully")
      );
  } catch (error) {
    console.error("Update online status error:", error);
    res
      .status(500)
      .json(
        API_RESPONSE(
          500,
          null,
          "Internal Server Error",
          "Failed to update online status"
        )
      );
  }
};

// Search users
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;

    if (!query || query.trim().length < 2) {
      return res
        .status(400)
        .json(
          API_RESPONSE(
            400,
            null,
            "Validation Error",
            "Search query must be at least 2 characters"
          )
        );
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: userId } }, // Exclude current user
        {
          $or: [
            { username: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
          ],
        },
      ],
    })
      .select("username email avatar isOnline lastSeen")
      .limit(20);

    res
      .status(200)
      .json(API_RESPONSE(200, { users }, null, "Users found successfully"));
  } catch (error) {
    console.error("Search users error:", error);
    res
      .status(500)
      .json(
        API_RESPONSE(
          500,
          null,
          "Internal Server Error",
          "Failed to search users"
        )
      );
  }
};

// Get online friends
export const getOnlineFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate({
      path: "friends",
      match: { isOnline: true },
      select: "username email avatar isOnline lastSeen",
    });

    const onlineFriends = user.friends.filter((friend) => friend.isOnline);

    res
      .status(200)
      .json(
        API_RESPONSE(
          200,
          { onlineFriends },
          null,
          "Online friends retrieved successfully"
        )
      );
  } catch (error) {
    console.error("Get online friends error:", error);
    res
      .status(500)
      .json(
        API_RESPONSE(
          500,
          null,
          "Internal Server Error",
          "Failed to get online friends"
        )
      );
  }
};
