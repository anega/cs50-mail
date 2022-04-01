from django.contrib import admin
from mail.models import User, Email


class EmailAdmin(admin.ModelAdmin):
    list_display = ('subject', 'user', 'read', 'archived', 'timestamp')


admin.site.register(User)
admin.site.register(Email, EmailAdmin)
