"""URL configuration for projetGrt project."""
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from reservation import api_views, views
from reservation.views import Login, Register, Logout

router = DefaultRouter()
router.register(r'clients', api_views.ClientViewSet)
router.register(r'voitures', api_views.VoitureViewSet)
router.register(r'trajets', api_views.TrajetViewSet)
router.register(r'reservations', api_views.ReservationViewSet)
router.register(r'contenirs', api_views.ContenirViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    
    path('api/', include(router.urls)),
    
    path('reservation/<str:pk>/recu/', views.ReservationRecu.as_view(), name='reservation_recu_name'),
    path('api/get-frais-trajet/', views.GetFraisTrajet.as_view(), name='get_frais_trajet'),
    
    path('api/register/', Register.as_view(), name='api_register'),
    path('api/login/', Login.as_view(), name='api_login'),
    path('api/logout/', Logout.as_view(), name='api_logout'),
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.REACT_BUILD_DIR)

urlpatterns += [re_path(r'^.*$', TemplateView.as_view(template_name='index.html'))]