from django.contrib import admin

from .models import Client, Contenir, Reservation, Trajet, Voiture

admin.site.register(Client)
admin.site.register(Voiture)
admin.site.register(Trajet)
admin.site.register(Reservation)
admin.site.register(Contenir)
