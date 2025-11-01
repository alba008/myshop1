# myshop/settings.py
from pathlib import Path
import os
from datetime import timedelta
from decouple import config
from django.utils.translation import gettext_lazy as _

BASE_DIR = Path(__file__).resolve().parent.parent

# --------------------------------------------------------------------------------------
# Core
# --------------------------------------------------------------------------------------
SECRET_KEY = "django-insecure-3q#6d7barp49^g*7@j6es02dsaa)0(ey4h!r8-@=up%sckn7i9"
DEBUG = True

ALLOWED_HOSTS = [
    "localhost", "127.0.0.1", "10.0.0.47", "sockcs.com", "www.sockcs.com",
]

# --------------------------------------------------------------------------------------
# Apps
# --------------------------------------------------------------------------------------
INSTALLED_APPS = [
    # Django
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Project apps (as per last occurrence)
    "accounts",
    "shop.apps.ShopConfig",
    "cart.apps.CartConfig",
    "orders.apps.OrdersConfig",
    "payment.apps.PaymentConfig",
    "coupons.apps.CouponsConfig",
    "recommendation",
    "recommender",
    "graphene_django",
    "support",
    "products",
    "customers.apps.CustomersConfig",
    "inventory.apps.InventoryConfig",

    # 3rd-party
    "django_bootstrap5",
    "rosetta",
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    "django_filters",
]

# --------------------------------------------------------------------------------------
# Middleware
# --------------------------------------------------------------------------------------
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",     # keep CORS first
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "myshop.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "cart.context_processors.cart_items_count",
                "shop.context_processors.category_list",
            ],
        },
    },
]

WSGI_APPLICATION = "myshop.wsgi.application"

# --------------------------------------------------------------------------------------
# Database (last occurrence)
# --------------------------------------------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": "myshop_dev",
        "USER": "myshop_user",
        "PASSWORD": "Leokesho@1",
        "HOST": "localhost",
        "PORT": "5432",
    }
}

# --------------------------------------------------------------------------------------
# Auth / Users
# --------------------------------------------------------------------------------------
AUTH_USER_MODEL = "accounts.User"
AUTHENTICATION_BACKENDS = ["django.contrib.auth.backends.ModelBackend"]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --------------------------------------------------------------------------------------
# i18n / l10n
# --------------------------------------------------------------------------------------
LANGUAGE_CODE = "en"
LANGUAGES = [
    ("en", _("English")),
    ("es", _("Spanish")),
]
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
LOCALE_PATHS = [BASE_DIR / "locale"]

# --------------------------------------------------------------------------------------
# Static / Media
# --------------------------------------------------------------------------------------
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# --------------------------------------------------------------------------------------
# CORS / CSRF / Cookies (HTTP dev)  — kept last-set values
# --------------------------------------------------------------------------------------
# (Earlier broader lists removed to preserve last effective behavior)
CORS_ALLOWED_ORIGINS = [
    "http://10.0.0.47:5174",
]
CORS_ALLOW_CREDENTIALS = True

SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_HTTPONLY = False  # frontend reads csrftoken
CSRF_TRUSTED_ORIGINS = [
    "http://10.0.0.47:8000",
    "http://10.0.0.47:5174",
]

SESSION_SERIALIZER = "django.contrib.sessions.serializers.JSONSerializer"

# --------------------------------------------------------------------------------------
# DRF (last merged config)
# --------------------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.TokenAuthentication",
    ],
    # Public by default; secure per-view for private endpoints
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
    ],
}

# --------------------------------------------------------------------------------------
# JWT (kept once)
# --------------------------------------------------------------------------------------
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": True,
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# --------------------------------------------------------------------------------------
# Email (last-set SMTP config)
# --------------------------------------------------------------------------------------
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.hostinger.com"
EMAIL_PORT = 465
EMAIL_HOST_USER = "lilian@blsuntechdynamics.com"
EMAIL_HOST_PASSWORD = "Leokesho@1"   # consider using env var
EMAIL_USE_SSL = True
DEFAULT_FROM_EMAIL = "Malamoyo <lilian@blsuntechdynamics.com>"
SERVER_EMAIL = "lilian@blsuntechdynamics.com"

# --------------------------------------------------------------------------------------
# Cart
# --------------------------------------------------------------------------------------
CART_SESSION_ID = "cart"

# --------------------------------------------------------------------------------------
# Stripe
# --------------------------------------------------------------------------------------
STRIPE_PUBLISHABLE_KEY = config("STRIPE_PUBLISHABLE_KEY", default="")
STRIPE_SECRET_KEY = config("STRIPE_SECRET_KEY", default="")
STRIPE_API_VERSION = "2024-04-10"
STRIPE_WEBHOOK_SECRET = config("STRIPE_WEBHOOK_SECRET", default="")

# --------------------------------------------------------------------------------------
# Redis (if used)
# --------------------------------------------------------------------------------------
REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_DB = 1

# --------------------------------------------------------------------------------------
# Sessions (last-set)
# --------------------------------------------------------------------------------------
SESSION_ENGINE = "django.contrib.sessions.backends.cached_db"
SESSION_COOKIE_AGE = 60 * 60 * 24 * 7        # 7 days
SESSION_SAVE_EVERY_REQUEST = True

# --------------------------------------------------------------------------------------
# OLLAMA / Graphene / Logging / Site
# --------------------------------------------------------------------------------------
OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'http://127.0.0.1:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3:8b-instruct-q4_0')
OLLAMA_TIMEOUT = int(os.getenv('OLLAMA_TIMEOUT', '12'))  # seconds

GRAPHENE = {
    "SCHEMA": "recommender.schema.schema",
}

LOGGING = {
    "version": 1,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "loggers": {"django.request": {"handlers": ["console"], "level": "INFO"}},
}

SITE_NAME = "Malamoyo Candle"
SITE_DOMAIN = "blsuntechdynamics.com"
FRONTEND_URL = "https://blsuntechdynamics.com"
FRONTEND_BASE_URL = "http://10.0.0.47:5174"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
