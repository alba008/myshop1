import { Box, Container, Typography, Card, CardContent, Avatar, Stack } from "@mui/material";

export default function Testimonials({ testimonials = [] }) {
  if (!testimonials.length) return null;

  return (
    <Box sx={{ bgcolor: "#0f1115", color: "white", py: { xs: 6, md: 8 } }}>
      <Container maxWidth="md">
        <Typography
          variant="h4"
          sx={{
            textAlign: "center",
            mb: 4,
            fontWeight: 800,
            letterSpacing: 0.5,
          }}
        >
          What People Say
        </Typography>

        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          justifyContent="center"
          alignItems="stretch"
        >
          {testimonials.map((t, i) => (
            <Card
              key={i}
              sx={{
                flex: 1,
                bgcolor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 3,
                backdropFilter: "blur(10px)",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="body1" sx={{ fontStyle: "italic", mb: 2 }}>
                  “{t.quote}”
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    src={t.avatar}
                    alt={t.name}
                    sx={{ width: 48, height: 48 }}
                  />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {t.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "#aaa" }}>
                      {t.role}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
