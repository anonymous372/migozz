import { API_RESPONSE } from "../utils/constants.js";
import Friend from "../models/Friend.js";
import User from "../models/User.js";

// Send friend request
export const sendFriendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const requesterId = req.user.id;

    if (requesterId === recipientId) {
      return res
        .status(400)
        .json(
          API_RESPONSE(
            400,
            null,
            "Validation Error",
            "Cannot send friend request to yourself"
          )
        );
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res
        .status(404)
        .json(API_RESPONSE(404, null, "Not Found", "User not found"));
    }

    // Check if friend request already exists
    const existingRequest = await Friend.findOne({
      $or: [
        { requester: requesterId, recipient: recipientId },
        { requester: recipientId, recipient: requesterId },
      ],
    });

    if (existingRequest) {
      return res
        .status(400)
        .json(
          API_RESPONSE(
            400,
            null,
            "Duplicate Error",
            "Friend request already exists"
          )
        );
    }

    // Check if already friends
    const requester = await User.findById(requesterId);
    if (requester.friends.includes(recipientId)) {
      return res
        .status(400)
        .json(API_RESPONSE(400, null, "Duplicate Error", "Already friends"));
    }

    const friendRequest = await Friend.create({
      requester: requesterId,
      recipient: recipientId,
    });

    res
      .status(201)
      .json(
        API_RESPONSE(
          201,
          { friendRequest },
          null,
          "Friend request sent successfully"
        )
      );
  } catch (error) {
    console.error("Send friend request error:", error);
    res
      .status(500)
      .json(
        API_RESPONSE(
          500,
          null,
          "Internal Server Error",
          "Failed to send friend request"
        )
      );
  }
};

// Get friend requests (sent and received)
export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const friendRequests = await Friend.find({
      $or: [{ recipient: userId }],
      status: "pending",
    })
      .populate("requester", "username email avatar")
      .populate("recipient", "username email avatar")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json(
        API_RESPONSE(
          200,
          { friendRequests },
          null,
          "Friend requests retrieved successfully"
        )
      );
  } catch (error) {
    console.error("Get friend requests error:", error);
    res
      .status(500)
      .json(
        API_RESPONSE(
          500,
          null,
          "Internal Server Error",
          "Failed to get friend requests"
        )
      );
  }
};

// Accept friend request
export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const friendRequest = await Friend.findById(requestId);
    if (!friendRequest) {
      return res
        .status(404)
        .json(API_RESPONSE(404, null, "Not Found", "Friend request not found"));
    }

    if (friendRequest.recipient.toString() !== userId) {
      return res
        .status(403)
        .json(
          API_RESPONSE(
            403,
            null,
            "Forbidden",
            "You can only accept requests sent to you"
          )
        );
    }

    if (friendRequest.status !== "pending") {
      return res
        .status(400)
        .json(
          API_RESPONSE(
            400,
            null,
            "Bad Request",
            "Friend request already processed"
          )
        );
    }

    // Update friend request status
    friendRequest.status = "accepted";
    await friendRequest.save();

    // Add to friends list for both users
    await User.findByIdAndUpdate(friendRequest.requester, {
      $addToSet: { friends: friendRequest.recipient },
    });
    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.requester },
    });

    res
      .status(200)
      .json(
        API_RESPONSE(
          200,
          { friendRequest },
          null,
          "Friend request accepted successfully"
        )
      );
  } catch (error) {
    console.error("Accept friend request error:", error);
    res
      .status(500)
      .json(
        API_RESPONSE(
          500,
          null,
          "Internal Server Error",
          "Failed to accept friend request"
        )
      );
  }
};

// Decline friend request
export const declineFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const friendRequest = await Friend.findById(requestId);
    if (!friendRequest) {
      return res
        .status(404)
        .json(API_RESPONSE(404, null, "Not Found", "Friend request not found"));
    }

    if (friendRequest.recipient.toString() !== userId) {
      return res
        .status(403)
        .json(
          API_RESPONSE(
            403,
            null,
            "Forbidden",
            "You can only decline requests sent to you"
          )
        );
    }

    friendRequest.status = "declined";
    await friendRequest.save();

    res
      .status(200)
      .json(
        API_RESPONSE(
          200,
          { friendRequest },
          null,
          "Friend request declined successfully"
        )
      );
  } catch (error) {
    console.error("Decline friend request error:", error);
    res
      .status(500)
      .json(
        API_RESPONSE(
          500,
          null,
          "Internal Server Error",
          "Failed to decline friend request"
        )
      );
  }
};

// Get friends list
export const getFriends = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).populate(
      "friends",
      "username email avatar isOnline lastSeen"
    );

    res
      .status(200)
      .json(
        API_RESPONSE(
          200,
          { friends: user.friends },
          null,
          "Friends list retrieved successfully"
        )
      );
  } catch (error) {
    console.error("Get friends error:", error);
    res
      .status(500)
      .json(
        API_RESPONSE(
          500,
          null,
          "Internal Server Error",
          "Failed to get friends list"
        )
      );
  }
};

// Remove friend
export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.id;

    // Remove from both users' friends list
    await User.findByIdAndUpdate(userId, {
      $pull: { friends: friendId },
    });
    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: userId },
    });

    // Update or create friend request status
    await Friend.findOneAndUpdate(
      {
        $or: [
          { requester: userId, recipient: friendId },
          { requester: friendId, recipient: userId },
        ],
      },
      { status: "declined" },
      { upsert: true }
    );

    res
      .status(200)
      .json(API_RESPONSE(200, null, null, "Friend removed successfully"));
  } catch (error) {
    console.error("Remove friend error:", error);
    res
      .status(500)
      .json(
        API_RESPONSE(
          500,
          null,
          "Internal Server Error",
          "Failed to remove friend"
        )
      );
  }
};
