from django.contrib.auth import login, logout
from django.contrib.auth.forms import AuthenticationForm
from django.contrib.auth.mixins import LoginRequiredMixin
from django.db.models import Q
from django.shortcuts import redirect
from django.urls import reverse
from django.views.generic import (
    CreateView, DeleteView, DetailView, ListView,
    TemplateView, UpdateView, View,
)

from reservation.models import Client, Voiture, Trajet, Reservation, Contenir

from django.urls import reverse_lazy
from django.http import JsonResponse
from django.views import View
from reservation.forms import ReservationForm, ContenirForm
from django.db.models import Q
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.contrib.auth.mixins import LoginRequiredMixin
from reservation.models import Client, Voiture, Trajet, Reservation
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User

from .models import Reservation
from rest_framework.pagination import PageNumberPagination
from rest_framework import viewsets
from .serializers import VoitureSerializer  


from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.shortcuts import render, get_object_or_404
from .models import Reservation, Contenir

class ReservationRecu(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        reservation = get_object_or_404(Reservation, pk=pk)
        
        contenus = Contenir.objects.filter(coder=reservation.coder)

        context = {
            'reservation': reservation,
            'contenus': contenus,
        }
        
        return render(request, 'recu.html', context)




PAGINATE_BY = 4


def page_de(coder):
    """Retourne le numéro de page (dans la liste) où se trouve la réservation `coder`."""
    position = Reservation.objects.filter(coder__gte=coder).count()
    return max((position - 1) // PAGINATE_BY + 1, 1)


class Register(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        email = request.data.get('email', '')
        password = request.data.get('password')

        if not username or not password:
            return Response({'error': 'Nom d\'utilisateur et mot de passe requis.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'error': 'Ce nom d\'utilisateur existe déjà.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, email=email, password=password)
        token, _ = Token.objects.get_or_create(user=user)

        return Response({
            'token': token.key,
            'username': user.username,
            'message': 'Compte créé avec succès !'
        }, status=status.HTTP_201_CREATED)

class Login(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({'error': 'Veuillez saisir le nom d\'utilisateur et le mot de passe.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_obj = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({'error': 'Nom d\'utilisateur incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response({'error': 'Mot de passe incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'username': user.username
        }, status=status.HTTP_200_OK)
class Logout(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        return Response({'message': 'Déconnecté'}, status=status.HTTP_200_OK)

class Home(LoginRequiredMixin, TemplateView):
    template_name = "home.html"
    login_url = 'login_name'



class ClientList(LoginRequiredMixin, ListView):
    model = Client
    template_name = "clients/list.html"
    context_object_name = "clients"
    paginate_by = 4
    ordering = ["-pk"]

class ClientInsert(LoginRequiredMixin, CreateView):
    model = Client
    fields = ['codec', 'nomc', 'prenomc', 'contact']
    template_name = "clients/insert.html"
    success_url = reverse_lazy('client_list_name')

class ClientUpdate(LoginRequiredMixin, UpdateView):
    model = Client
    fields = ['nomc', 'prenomc', 'contact']
    template_name = "clients/update.html"
    success_url = reverse_lazy('client_list_name')

class ClientDelete(LoginRequiredMixin, DeleteView):
    model = Client
    template_name = "clients/delete.html"
    context_object_name = "client"
    success_url = reverse_lazy('client_list_name')

class VoitureList(LoginRequiredMixin, ListView):
    model = Voiture
    template_name = "voitures/list.html"
    context_object_name = "voitures"
    paginate_by = 5

class VoitureInsert(LoginRequiredMixin, CreateView):
    model = Voiture
    fields = ['numv', 'marqueV', 'capaciteV'] 
    template_name = "voitures/insert.html"
    success_url = reverse_lazy('voiture_list_name')

class VoitureUpdate(LoginRequiredMixin, UpdateView):
    model = Voiture
    fields = ['markv']  
    template_name = "voitures/update.html"
    success_url = reverse_lazy('voiture_list_name')

class VoitureDelete(LoginRequiredMixin, DeleteView):
    model = Voiture
    template_name = "voitures/delete.html"
    context_object_name = "voiture"
    success_url = reverse_lazy('voiture_list_name')


class TrajetList(LoginRequiredMixin, ListView):
    model = Trajet
    template_name = "trajets/list.html"
    context_object_name = "trajets"
    paginate_by = 5

class TrajetInsert(LoginRequiredMixin, CreateView):
    model = Trajet
    fields = ['destinations', 'frais']
    template_name = "trajets/insert.html"
    success_url = reverse_lazy('trajet_list_name')

class TrajetUpdate(LoginRequiredMixin, UpdateView):
    model = Trajet
    fields = ['frais']
    template_name = "trajets/update.html"
    success_url = reverse_lazy('trajet_list_name')

class TrajetDelete(LoginRequiredMixin, DeleteView):
    model = Trajet
    template_name = "trajets/delete.html"
    context_object_name = "trajet"
    success_url = reverse_lazy('trajet_list_name')


class ReservationList(LoginRequiredMixin, ListView):
    model = Reservation
    template_name = "reservation/list.html"
    context_object_name = "reservations"
    paginate_by = PAGINATE_BY
    ordering = ["-coder"]
    login_url = 'login_name'

    def get_queryset(self):
        queryset = super().get_queryset().select_related("codec", "numv")
        value = self.request.GET.get("search")
        if value:
            queryset = queryset.filter(
                Q(codec__nomc__icontains=value)
                | Q(codec__prenomc__icontains=value)
                | Q(placesr__icontains=value)
            )
        return queryset


class ReservationInfo(LoginRequiredMixin, DetailView):
    model = Reservation
    template_name = "reservation/info.html"
    context_object_name = "reservation"
    login_url = 'login_name'


class ReservationRedirect(LoginRequiredMixin, View):
    """Reçoit le formulaire (boutons Modifier / Supprimer) et redirige."""
    login_url = 'login_name'
    action_map = {
        "Modifier": "update_name",
        "Supprimer": "delete_name",
    }

    def post(self, request, *args, **kwargs):
        view_name = self.action_map.get(request.POST.get("action"))
        if view_name:
            return redirect(view_name, pk=kwargs["pk"])
        return redirect("list_name")


class ReservationInsert(LoginRequiredMixin, CreateView):
    model = Reservation
    fields = ["coder", "datesr", "departr", "arriver", "placesr", "nombrep", "codec", "numv"]
    template_name = "reservation/insert.html"
    login_url = 'login_name'

    def get_success_url(self):
        return f"{reverse('list_name')}?page={page_de(self.object.coder)}#{self.object.coder}"


class ReservationUpdate(LoginRequiredMixin, UpdateView):
    model = Reservation
    fields = ["datesr", "departr", "arriver", "placesr", "nombrep", "codec", "numv"]
    template_name = "reservation/update.html"
    login_url = 'login_name'

    def get_success_url(self):
        return f"{reverse('list_name')}?page={page_de(self.object.coder)}#{self.object.coder}"


class ReservationDelete(LoginRequiredMixin, DetailView):
    model = Reservation
    template_name = "reservation/delete.html"
    context_object_name = "reservation"
    login_url = 'login_name'


class ReservationDeleteOperation(LoginRequiredMixin, DeleteView):
    model = Reservation
    template_name = "reservation/delete.html"
    context_object_name = "reservation"
    login_url = 'login_name'

    def form_valid(self, form):
        self.pk_supprime = self.object.pk
        return super().form_valid(form)

    def get_success_url(self):
        precedent = (
            Reservation.objects.filter(coder__lt=self.pk_supprime)
            .order_by("-coder").values_list("coder", flat=True).first()
        )
        if precedent is None:
            return reverse('list_name')
        return f"{reverse('list_name')}?page={page_de(precedent)}#{precedent}"

class ReservationList(LoginRequiredMixin, ListView):
    model = Reservation
    template_name = "reservation/list.html"
    context_object_name = "reservations"
    paginate_by = PAGINATE_BY
    ordering = ["-coder"]
    login_url = 'login_name'

    def get_queryset(self):
        queryset = super().get_queryset().select_related("codec", "numv")
        
        date_debut = self.request.GET.get("date_debut")
        date_fin = self.request.GET.get("date_fin")
        search = self.request.GET.get("search")

        if date_debut and date_fin:
            queryset = queryset.filter(datesr__range=[date_debut, date_fin])
        elif date_debut:
            queryset = queryset.filter(datesr__gte=date_debut)
        elif date_fin:
            queryset = queryset.filter(datesr__lte=date_fin)

        if search:
            queryset = queryset.filter(
                Q(codec__nomc__icontains=search)
                | Q(codec__prenomc__icontains=search)
                | Q(placesr__icontains=search)
            )
        return queryset

class ReservationInsert(LoginRequiredMixin, CreateView):
    model = Reservation
    form_class = ReservationForm
    template_name = "reservation/insert.html"
    login_url = 'login_name'

    def get_success_url(self):
        return reverse('list_name')

class ReservationUpdate(LoginRequiredMixin, UpdateView):
    model = Reservation
    form_class = ReservationForm
    template_name = "reservation/update.html"
    login_url = 'login_name'

    def get_success_url(self):
        return reverse('list_name')

class ContenirInsert(LoginRequiredMixin, CreateView):
    model = Contenir
    form_class = ContenirForm
    template_name = "contenir/insert.html"
    success_url = reverse_lazy('contenir_list_name')

class GetFraisTrajet(LoginRequiredMixin, View):
    """API pour retourner le tarif (frais) d'un trajet en JSON."""
    def get(self, request, *args, **kwargs):
        destination = request.GET.get('destination')
        try:
            trajet = Trajet.objects.get(pk=destination)
            return JsonResponse({'frais': float(trajet.frais)})
        except Trajet.DoesNotExist:
            return JsonResponse({'frais': 0})

class ContenirList(LoginRequiredMixin, ListView):
    model = Contenir
    template_name = "contenir/list.html"
    context_object_name = "contenus"
    paginate_by = 4

class ContenirInsert(LoginRequiredMixin, CreateView):
    model = Contenir
    fields = ['coder', 'destinations', 'montants']
    template_name = "contenir/insert.html"
    success_url = reverse_lazy('contenir_list_name')

class ContenirUpdate(LoginRequiredMixin, UpdateView):
    model = Contenir
    fields = ['coder', 'destinations', 'montants']
    template_name = "contenir/update.html"
    success_url = reverse_lazy('contenir_list_name')

class ContenirDelete(LoginRequiredMixin, DeleteView):
    model = Contenir
    template_name = "contenir/delete.html"
    success_url = reverse_lazy('contenir_list_name')

class ClientList(LoginRequiredMixin, ListView):
    model = Client
    template_name = "clients/list.html"
    context_object_name = "clients"
    paginate_by = 10

    def get_queryset(self):
        queryset = super().get_queryset().order_by("-pk")
        query = self.request.GET.get('search')
        if query:
            queryset = queryset.filter(
                Q(codec__icontains=query) |
                Q(nomc__icontains=query) |
                Q(prenomc__icontains=query) |
                Q(contact__icontains=query)
            )
        return queryset


class VoitureList(LoginRequiredMixin, ListView):
    model = Voiture
    template_name = "voitures/list.html"
    context_object_name = "voitures"
    paginate_by = 10

    def get_queryset(self):
        queryset = super().get_queryset()
        query = self.request.GET.get('search')
        if query:
            queryset = queryset.filter(
                Q(numv__icontains=query) |
                Q(markv__icontains=query)
            )
        return queryset


class TrajetList(LoginRequiredMixin, ListView):
    model = Trajet
    template_name = "trajets/list.html"
    context_object_name = "trajets"
    paginate_by = 10

    def get_queryset(self):
        queryset = super().get_queryset()
        query = self.request.GET.get('search')
        if query:
            queryset = queryset.filter(
                Q(destinations__icontains=query)
            )
        return queryset

class ReservationRecu(LoginRequiredMixin, DetailView):
    model = Reservation
    template_name = "reservation/recu.html"
    context_object_name = "reservation"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['contenus'] = Contenir.objects.filter(coder=self.object).select_related('destinations')
        return context

class StandardPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
    max_page_size = 100

class VoitureViewSet(viewsets.ModelViewSet):
    queryset = Voiture.objects.all().order_by('numv')
    serializer_class = VoitureSerializer
    pagination_class = StandardPagination