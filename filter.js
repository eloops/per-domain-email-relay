// filter.js
// This sets up per-domain relaying using msmtp (microsoft sendmail)
// Each valid domain should have a corresponding sendmail .conf in the conf folder
// ie for google.com it should be google.com.conf

// As emails are received by emailrelay.exe (in server mode) this script is run with the content file as an argument

// emailrelay should be started with the command:
// emailrelay.exe -d -s E:\emailrelay\spool -z "c:\windows\system32\cscript.exe //nologo E:\emailrelay\filter.js" -r

// alternate for logging:
// emailrelay.exe -n -l -s E:\emailrelay\spool -z "c:\windows\system32\cscript.exe //nologo E:\emailrelay\filter.js" -r -v >> E:\emailrelay\log\emailrelay.log 2>&1

// TBD: Date stamping of log files


// Constants
var validDomains = ['domain1.com','domain2.com','domain3.com'] ;
var sm = "E:\\emailrelay\\msmtp.exe"
var confDir = "E:\\emailrelay\\conf"
var logfile = "E:\\emailrelay\\log\\filter.log"
var ret = new RegExp( "MailRelay-To-Remote:\s?.*@\(.*\)" ) ;
// var ref = new RegExp( "MailRelay-From:\s?.*@\(.*\)" ) ;
var strCmd = "%comspec% /c " + sm + " -C " + confDir + "\\"

var exitCodes = new Array() ;
exitCodes = {"64" : "Incorrect usage.", "65" : "Something wrong with email input.", "66" : "Input file not read or doesn't exist", "67" : "Specified user is invalid.", "68" : "Specified host does not exist.", "69" : "Service unavailable. Or, something else went wrong.", "70" : "Internal software error occurred." , "71" : "OS error occurred.", "72" : "System file cannot be opened. Possibly syntax error.", "73" : "Unable to create specified file.", "74" : "Error occurred while performing I/O on a file.", "75" : "Temp error. Or, mailer could not create a connection.", "76" : "Handshake produced something impossible.", "77" : "No permission to perform operation.", "78" : "Something wasn't configured correctly."} ;

var fs = WScript.CreateObject("Scripting.FileSystemObject") ; 

// Debug logging
if (fs.FileExists(logfile)) {
  var lf = fs.OpenTextFile(logfile, 8) ; 
} else {
  var lf = fs.CreateTextFile(logfile, true) ;
} ;
   
// Grab the filename of the content file passed to filter.js
var content = WScript.Arguments(0) ;

// Grab the filename of the envelope
var envNew = content.substr(0,content.length-7) + "envelope.new" ;
var envelope = content.substr(0,envNew.length-3) ;

// parse the envelope into a variable 'e'
var ts = fs.OpenTextFile( envNew , 1 , false ) ;
var e = ts.ReadAll() ;
ts.Close() ;

// Grab the domain of the To address from the envelope
var tdom = e.match(ret)[1] ;
// var fdom = e.match(ref)[1] ;

// replace carriage returns (CR & LF)
tdom = tdom.replace("\r", "") ;
tdom = tdom.replace("\n", "") ;
lf.WriteLine("filter.js: info: Detected domain is " + tdom) ;
// fdom = fdom.replace("\r", "") ;
// fdom = fdom.replace("\n", "") ;

// go through list of domains to see if detected matches
for ( var a = 0; a < validDomains.length; a++ ) {
  // if it does (extra is in case we want to compare to/from domains as well)
  if ( tdom === validDomains[a] /* && tdom === fdom */ ) {
    
    // build our command to be executed
    var strCmd = strCmd + tdom + ".conf -t < " + content ;
    
    // create the shell & exec objects
    var sh = WScript.CreateObject( "Wscript.Shell" ) ;
    var oExec = sh.Exec(strCmd) ;
    lf.WriteLine("msmtp: info: Email Send: " + content + " to " + tdom) ;
    
    // actually run the command and wait for it to finish
    while (oExec.Status === 0) ; {
      WScript.Sleep(100) ;
    } ;
    // if there was an error, log the code & reason then drop back to emailrelay
    if (oExec.ExitCode != 0) {
      lf.Write("msmtp: error: returned with exit code " + oExec.ExitCode + ": " + exitCodes[oExec.ExitCode.toString()]) ;
      lf.close() ;
      WScript.Quit( 1 ) ;
    } else {
      // if there was no errors from msmtp, delete files and return with 100 code to emailrelay
      lf.WriteLine("msmtp: info: Deleting files and returning successfully to script.") ;
      if (fs.FileExists(content)) {
        fs.DeleteFile(content) ;
      }
      if (fs.FileExists(envelope)) {
        fs.DeleteFile(envelope) ;
      }
      if (fs.FileExists(envNew)) {
        fs.DeleteFile(envNew) ;
      }
      lf.close() ;
      WScript.Quit( 100 ) ;
    } ;
  } ;
} ;
// close up logfile and quit back to emailrelay if nothing else has happened
lf.close()
WScript.Quit( 0 ) ;
