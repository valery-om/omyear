export default {
  async fetch() {
    return Response.json(
      { status: "ok", service: "omyear-editorial" },
      { headers: { "Cache-Control": "no-store" } },
    );
  },
};
