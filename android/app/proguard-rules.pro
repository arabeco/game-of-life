# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# If your project uses WebView with JS, uncomment the following
# and specify the fully qualified class name to the JavaScript interface
# class:
#-keepclassmembers class fqcn.of.javascript.interface.for.webview {
#   public *;
#}

# Uncomment this to preserve the line number information for
# debugging stack traces.
-keepattributes SourceFile,LineNumberTable

# If you keep the line number information, uncomment this to
# hide the original source file name.
-renamesourcefileattribute SourceFile

# O NUCLEO DO CAPACITOR FICA INTEIRO.
#
# Ele le em tempo de execucao a anotacao de cada plugin (nome, permissoes,
# metodos). Com o R8 em modo completo, o campo que guarda essa anotacao em
# PluginHandle sumia, e PushNotifications.checkPermissions() estourava
# NullPointerException em Plugin.getPermissionStates() logo depois do login:
# o 107 fechava ao abrir, no fim do video inicial. As regras que o proprio
# Capacitor traz guardam os plugins, mas nao o nucleo que os le.
-keep class com.getcapacitor.** { *; }
-keepattributes *Annotation*
