import { getAuth } from "@clerk/express";

export const requireUser = (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }
    req.userId = userId;
    return next();
  } catch (error) {
    console.error("[requireUser] auth lookup failed:", error?.message || error);
    return res.status(500).json({ success: false, message: "Authentication check failed." });
  }
};
