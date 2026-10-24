from rest_framework import viewsets
from reservation.models import Client, Voiture, Trajet, Reservation, Contenir
from reservation.serializers import (
    ClientSerializer, VoitureSerializer, TrajetSerializer, 
    ReservationSerializer, ContenirSerializer
)

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.order_by('-pk')
    serializer_class = ClientSerializer

class VoitureViewSet(viewsets.ModelViewSet):
    queryset = Voiture.objects.all()
    serializer_class = VoitureSerializer

class TrajetViewSet(viewsets.ModelViewSet):
    queryset = Trajet.objects.all()
    serializer_class = TrajetSerializer

class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.order_by('-pk')
    serializer_class = ReservationSerializer

class ContenirViewSet(viewsets.ModelViewSet):
    queryset = Contenir.objects.all()
    serializer_class = ContenirSerializer