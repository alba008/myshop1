export function displayName(user) {
    if (!user) return "";
    const first = (user.first_name || "").trim();
    const last = (user.last_name || "").trim();
    if (first || last) return `${first} ${last}`.trim();
    return user.username || user.email || "";
  }
  