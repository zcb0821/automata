# coding=utf-8
from django.shortcuts import render
from django.http import HttpResponse

# ---------------------
# 获取主页
# ---------------------
def get_index(request):
    return render(request, 'index.html')


# ---------------------
# 有限自动机
# ---------------------

# NFA转DFA
def nfa_to_dfa(request):
    data = {}
    return HttpResponse(data)


# dfa最小化
def dfa_minimize(request):
    data = {}
    return HttpResponse(data)


# 输入串检查
def finite_check(request):
    data = False
    return HttpResponse(data)


# 自动机转正则表达式
def finite_to_regular(request):
    data = ''
    return HttpResponse(data)


# ---------------------
# 正则表达式
# ---------------------



# ---------------------
# 上下文无关文法
# ---------------------




# ---------------------
# 下推自动机
# ---------------------






# ---------------------
# 图灵机
# ---------------------