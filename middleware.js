// Vercel Edge middleware — redirect HTTP requests to HTTPS
export default async function (request) {
  const proto = request.headers.get("x-forwarded-proto") || "";
  if (proto.toLowerCase() === "http") {
    const url = new URL(request.url);
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }

  // Allow the request to continue to the site
  return fetch(request);
}
