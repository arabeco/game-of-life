param([string]$QueryFile, [switch]$Apply, [switch]$RotateWebhook, [switch]$ConfigureDeletionRedirects, [switch]$AuditMailConfig, [switch]$SendAuthorizedMailTest)
$ErrorActionPreference = 'Stop'
# Use only the existing Supabase CLI credential. Never emit its blob/token.
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class GlyphSupabaseCredential {
 [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
 public struct Credential { public uint Flags; public uint Type; public IntPtr Target; public IntPtr Comment; public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten; public uint Size; public IntPtr Blob; public uint Persist; public uint Count; public IntPtr Attributes; public IntPtr Alias; public IntPtr User; }
 [DllImport("advapi32.dll", EntryPoint="CredReadW", CharSet=CharSet.Unicode, SetLastError=true)] public static extern bool Read(string target,uint type,uint flags,out IntPtr credential);
 [DllImport("advapi32.dll")] public static extern void CredFree(IntPtr credential);
 public static string Get() { IntPtr p; if(!Read("Supabase CLI:supabase",1,0,out p))throw new Exception("Supabase CLI credential unavailable"); try {var c=Marshal.PtrToStructure<Credential>(p);var bytes=new byte[c.Size];Marshal.Copy(c.Blob,bytes,0,bytes.Length);return System.Text.Encoding.UTF8.GetString(bytes);}finally{CredFree(p);} }
}
'@
$taskToken = [GlyphSupabaseCredential]::Get()
if (-not $taskToken.StartsWith('sbp_')) { throw 'Unsupported CLI credential format; nothing changed.' }
$taskHeaders = @{ Authorization = "Bearer $taskToken" }
if ($AuditMailConfig -or $SendAuthorizedMailTest) {
  try {
    $taskConfig = Invoke-RestMethod -Method Get -Uri 'https://api.supabase.com/v1/projects/klmsdcncmhtgnlcejzdi/config/auth' -Headers $taskHeaders
    if ($SendAuthorizedMailTest) {
      if ($taskConfig.smtp_host -ne 'smtp.resend.com' -or -not $taskConfig.smtp_pass.StartsWith('re_')) { Write-Output '{"testBlocked":"SMTP credential is masked or unavailable for API test"}'; exit }
      $taskMailHeaders = @{Authorization="Bearer $($taskConfig.smtp_pass)";'Idempotency-Key'='glyph-mail-audit-20261016-misterx-01'}
      $taskMailBody = @{from="Glyph <$($taskConfig.smtp_admin_email)>";to=@('misterxhermit@gmail.com');subject='Glyph - teste de entrega de e-mail';text='Este e um teste solicitado por voce para conferir a entrega de e-mails do Glyph pelo Resend. Nenhuma conta foi excluida ou alterada. Se recebeu esta mensagem, confirme no chat.'} | ConvertTo-Json
      $taskMailResult = Invoke-RestMethod -Method Post -Uri 'https://api.resend.com/emails' -Headers $taskMailHeaders -ContentType 'application/json' -Body $taskMailBody
      @{accepted=([bool]$taskMailResult.id);providerId=$taskMailResult.id;recipient='misterxhermit@gmail.com';credentialSource='Auth SMTP';sentThrough='Resend API'} | ConvertTo-Json
    } else {
      @{smtpHost=$taskConfig.smtp_host;smtpPort=$taskConfig.smtp_port;sender=$taskConfig.smtp_admin_email;emailProviderEnabled=$taskConfig.external_email_enabled; smtpPasswordPresent=(-not [string]::IsNullOrEmpty($taskConfig.smtp_pass))} | ConvertTo-Json
    }
  } catch { @{operation='mail-test-or-config';httpStatus=[int]$_.Exception.Response.StatusCode;errorType=$_.Exception.GetType().Name} | ConvertTo-Json }
  finally {$taskToken=$null;$taskHeaders=$null;$taskConfig=$null;$taskMailHeaders=$null}
  exit
}
if ($ConfigureDeletionRedirects) {
  try {
    $taskUri = 'https://api.supabase.com/v1/projects/klmsdcncmhtgnlcejzdi/config/auth'
    $taskConfig = Invoke-RestMethod -Method Get -Uri $taskUri -Headers $taskHeaders
    $taskUrls = @($taskConfig.uri_allow_list -split ',' | Where-Object { $_ })
    $taskUrls += 'https://glyph.life/exclusao.html','https://www.glyph.life/exclusao.html'
    $taskUrls = @($taskUrls | Select-Object -Unique)
    $taskBody = @{uri_allow_list=($taskUrls -join ',')} | ConvertTo-Json
    Invoke-RestMethod -Method Patch -Uri $taskUri -Headers $taskHeaders -ContentType 'application/json' -Body $taskBody | Out-Null
    $taskVerified = Invoke-RestMethod -Method Get -Uri $taskUri -Headers $taskHeaders
    @{redirectsConfigured=($taskVerified.uri_allow_list -like '*https://glyph.life/exclusao.html*');magicLinkTemplateUsesConfirmationUrl=($taskVerified.mailer_templates_magic_link_content -match 'ConfirmationURL');magicLinkTemplateIsDefault=[string]::IsNullOrEmpty($taskVerified.mailer_templates_magic_link_content)} | ConvertTo-Json
  } catch { throw 'Could not configure deletion redirect URLs; sensitive response suppressed.' }
  finally {$taskToken=$null;$taskHeaders=$null;$taskConfig=$null;$taskVerified=$null}
  exit
}
if ($RotateWebhook) {
  $taskApi = 'https://api.supabase.com/v1/projects/klmsdcncmhtgnlcejzdi'
  $taskOld = $null
  try {
    $taskRead = @{query="select value from public.internal_runtime_config where key='web_push_webhook_secret'";read_only=$true} | ConvertTo-Json
    $taskRows = @(Invoke-RestMethod -Method Post -Uri "$taskApi/database/query" -Headers $taskHeaders -ContentType 'application/json' -Body $taskRead)
    $taskOld = $taskRows[0].value
    if ([string]::IsNullOrEmpty($taskOld)) { throw 'Missing current webhook configuration' }
    $taskBytes = New-Object byte[] 32
    $taskRng = [Security.Cryptography.RandomNumberGenerator]::Create()
    $taskRng.GetBytes($taskBytes); $taskRng.Dispose()
    $taskNew = [BitConverter]::ToString($taskBytes).Replace('-','').ToLowerInvariant()
    $taskSecretsBody = ConvertTo-Json -InputObject @(@{name='WEB_PUSH_WEBHOOK_SECRET';value=$taskNew})
    Invoke-RestMethod -Method Post -Uri "$taskApi/secrets" -Headers $taskHeaders -ContentType 'application/json' -Body $taskSecretsBody | Out-Null
    $taskChange = @{query="update public.internal_runtime_config set value='$taskNew', updated_at=now() where key='web_push_webhook_secret'";read_only=$false} | ConvertTo-Json
    Invoke-RestMethod -Method Post -Uri "$taskApi/database/query" -Headers $taskHeaders -ContentType 'application/json' -Body $taskChange | Out-Null
    Write-Output '{"rotated":true}'
  } catch {
    if ($taskOld) {
      $taskRestore = ConvertTo-Json -InputObject @(@{name='WEB_PUSH_WEBHOOK_SECRET';value=$taskOld})
      Invoke-RestMethod -Method Post -Uri "$taskApi/secrets" -Headers $taskHeaders -ContentType 'application/json' -Body $taskRestore | Out-Null
    }
    throw 'Webhook rotation failed; secret values suppressed.'
  } finally { $taskToken=$null; $taskHeaders=$null; $taskOld=$null; $taskNew=$null }
  exit
}
if (-not $QueryFile) { throw 'QueryFile required' }
$taskSql = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $QueryFile))
$taskBody = @{query=$taskSql;read_only=(-not $Apply)} | ConvertTo-Json
try {
  $taskResult = Invoke-RestMethod -Method Post -Uri 'https://api.supabase.com/v1/projects/klmsdcncmhtgnlcejzdi/database/query' -Headers $taskHeaders -ContentType 'application/json' -Body $taskBody
  $taskResult | ConvertTo-Json -Depth 12
} catch { throw 'Management query failed; response suppressed to protect credentials.' }
finally { $taskToken=$null; $taskHeaders=$null }
