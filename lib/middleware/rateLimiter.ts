export default function errorHandler(
  err: any,
  req: any,
  res: any
) {
  console.error(err.stack);
  res.status(500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
  });
}
