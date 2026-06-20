const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = {
  get: async (endpoint: string) => {
    const res = await fetch(`${BASE_URL}${endpoint}`);
    if (!res.ok) throw new Error("API Request Failed");
    return res.json();
  },
  post: async (endpoint: string, data: any) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("API Request Failed");
    return res.json();
  },
};

export const questionService = {
  generate: (studentId: string, roundType: string) =>
    api.get(`/questions/generate?student_id=${studentId}&round_type=${roundType}`),
};

export const userService = {
  getProfile: () => api.get("/users/me"),
};

export const matchService = {
  create: (settings: any) => api.post("/matches/create", settings),
};
