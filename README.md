# per-domain-email-relay
Filter for emailrelay to enable per-domain relaying of email for internal network.

This filter is to be used with the Windows version of emailrelay found at: http://emailrelay.sourceforge.net/

The filter uses 'msmtp' a Windows version of sendmail found here: http://msmtp.sourceforge.net/

Start emailrelay with the following options:

    emailrelay.exe --as-server --spool-dir C:\emailrelay\spool --filter "C:\Windows\System32\cscript.exe //nologo C:\emailrelay\filter.js" --remote-clients

Or more concisely:

    emailrelay.exe -d -s C:\emailrelay\spool -z "c:\windows\system32\cscript.exe //nologo C:\emailrelay\filter.js" -r

You'll need a valid sendmail conf in the emailrelay\conf folder for each valid domain. See the file comments for more details.
