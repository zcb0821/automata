from django.conf.urls import patterns, include, url

from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'automata.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),

    url(r'^admin/', include(admin.site.urls)),
)


urlpatterns += patterns('main.views',
    (r'^$', 'get_index'),
);

urlpatterns += patterns('main.views',
    (r'^/finite/nfatodfa/$', 'nfa_to_dfa'),
    (r'^/finite/minimize/$', 'dfa_minimize'),
    (r'^/finite/check/$', 'finite_check'),
    (r'^/finite/converttoregular/$', 'finite_to_regular'),
);