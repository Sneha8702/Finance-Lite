from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):
    dependencies = [
        ("chelav", "0004_accountemail_emailactiontoken"),
    ]

    operations = [
        migrations.AddField(
            model_name="emailactiontoken",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
    ]
