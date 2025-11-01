// src/components/ProductCard.jsx
import { api } from "../lib/http";
import { Card, CardContent, CardMedia, Typography, Button, Chip, Box } from "@mui/material";

export default function ProductCard({ p, onAdded }) {
  const add = async (e) => {
    e.preventDefault();
    await api("/api/cart/item/", {
      method: "POST",
      body: JSON.stringify({ product_id: p.id, quantity: 1 }),
      credentials: "include",
    });
    onAdded?.(); // refresh parent state if provided
  };

  return (
    <Card
      sx={{
        borderRadius: 1,
        overflow: "hidden",
        bgcolor: "background.paper",
        boxShadow: 3,
        transition: "0.3s",
        "&:hover": { boxShadow: 6, transform: "translateY(-4px)" },
      }}
    >
      <Box sx={{ position: "relative" }}>
        <CardMedia
          component="img"
          height="200"
          image={p?.image || "/placeholder.png"}
          alt={p?.name || "Product"}
          sx={{ objectFit: "cover", p: 1, bgcolor: "black" }}
        />
        {p?.category?.name && (
          <Chip
            label={p.category.name}
            size="small"
            sx={{
              position: "absolute",
              top: 8,
              left: 2,
              bgcolor: "rgba(0,0,0,0.6)",
              color: "white",
              fontSize: "0.7rem",
              backdropFilter: "blur(4px)",
            }}
          />
        )}
      </Box>

      <CardContent>
        <Typography variant="h6" noWrap>
          {p?.name || "Unnamed Product"}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ minHeight: 40, mb: 1 }}
        >
          {p?.description || "No description available"}
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="subtitle1" fontWeight="bold" color="primary">
            {p?.price
              ? Number(p.price).toLocaleString(undefined, {
                  style: "currency",
                  currency: "USD",
                })
              : "N/A"}
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={add}
          >
            Add to Cart
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
