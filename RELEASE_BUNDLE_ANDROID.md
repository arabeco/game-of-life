# Release Bundle Android - GLYPH

Objetivo: gerar o primeiro `.aab` para upload no Google Play.

## 1. O que o projeto ja suporta

- assinatura de release por `android/keystore.properties`
- keystore ignorada no git
- output esperado via `bundleRelease`

Arquivos:

- [android/app/build.gradle](/C:/Users/Afonso/Downloads/GOL1.006/android/app/build.gradle)
- [android/keystore.properties.example](/C:/Users/Afonso/Downloads/GOL1.006/android/keystore.properties.example)

## 2. O que falta antes do `.aab`

Criar uma upload keystore.

Sugestao:

- alias: `glyphupload`
- arquivo: `android/app/glyph-upload-key.jks`

Depois criar:

- `android/keystore.properties`

Com este formato:

```properties
storeFile=app/glyph-upload-key.jks
storePassword=SUA_SENHA
keyAlias=glyphupload
keyPassword=SUA_SENHA
```

## 3. Comando para gerar o bundle

Usando o JDK do Android Studio:

```powershell
cmd /c "set JAVA_HOME=C:\Program Files\Android\Android Studio\jbr&& set PATH=%JAVA_HOME%\bin;%PATH%&& gradlew.bat bundleRelease"
```

Executar em:

- [android](/C:/Users/Afonso/Downloads/GOL1.006/android)

## 4. Saida esperada

Arquivo:

- `android/app/build/outputs/bundle/release/app-release.aab`

## 5. Observacao importante

Se `keystore.properties` nao existir, o projeto continua funcionando para debug, mas o `bundleRelease` nao vai servir para upload na Play.
