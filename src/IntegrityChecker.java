import java.applet.Applet;
import java.awt.BorderLayout;
import java.awt.Button;
import java.awt.Component;
import java.awt.Dialog;
import java.awt.FlowLayout;
import java.awt.Frame;
import java.awt.Label;
import java.awt.Panel;
import java.awt.TextArea;
import java.awt.TextField;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.security.AccessController;
import java.security.KeyStore;
import java.security.PrivilegedAction;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.TrustManagerFactory;

import org.apache.commons.io.IOUtils;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;

public class IntegrityChecker extends Applet {
	private static final long serialVersionUID = 1L;
	static final String blockchainBaseURL = "https://blockchain.info/wallet";
	static final String blockchainResources = "https://blockchain.info/Resources/wallet";
	static final String githubBaseURL = "https://raw.github.com/zootreeves/blockchain.info/master";

	static final  List<String> userAgents = new ArrayList<String>();
	static final TextArea out = new TextArea();

	static {
		//Select from a Pool of random user agents
		//Prevent the potential attacker serving modified content to specific user agents
		userAgents.add("Mozilla/5.0 (Windows; U; Windows NT 5.1; en-GB; rv:1.8.1.6) Gecko/20070725 Firefox/2.0.0.6");
		userAgents.add("Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1)");
		userAgents.add("Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; .NET CLR 1.1.4322; .NET CLR 2.0.50727; .NET CLR 3.0.04506.30)");
		userAgents.add("Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; .NET CLR 1.1.4322)");
		userAgents.add("Mozilla/4.0 (compatible; MSIE 5.0; Windows NT 5.1; .NET CLR 1.1.4322)");
		userAgents.add("Opera/9.20 (Windows NT 6.0; U; en)");
		userAgents.add("Opera/9.00 (Windows NT 5.1; U; en)");
		userAgents.add("Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; en) Opera 8.50");
		userAgents.add("Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; en) Opera 8.0");
		userAgents.add("Mozilla/4.0 (compatible; MSIE 6.0; MSIE 5.5; Windows NT 5.1) Opera 7.02 [en]");
		userAgents.add("Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.7.5) Gecko/20060127 Netscape/8.1");
		userAgents.add("Mozilla/5.0 (Windows NT 6.1; WOW64; rv:9.0.1) Gecko/20100101 Firefox/9.0.1");
		userAgents.add("Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.7 (KHTML, like Gecko) Chrome/16.0.912.75 Safari/535.7");
		userAgents.add("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_2) AppleWebKit/534.52.7 (KHTML, like Gecko) Version/5.1.2 Safari/534.52.7");
		userAgents.add("Mozilla/5.0 (Windows NT 5.1; rv:9.0.1) Gecko/20100101 Firefox/9.0.1");
		userAgents.add("Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.7 (KHTML, like Gecko) Chrome/16.0.912.77 Safari/535.7");
		userAgents.add("Mozilla/5.0 (Windows NT 5.1) AppleWebKit/535.7 (KHTML, like Gecko) Chrome/16.0.912.75 Safari/535.7");
		userAgents.add("Mozilla/5.0 (Macintosh; Intel Mac OS X 10.7; rv:9.0.1) Gecko/20100101 Firefox/9.0.1");
		userAgents.add("Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)");
	}


	public static void main(String [] args)
	{
		Frame f = new Frame("My Wallet Integrity Verifier");

		IntegrityChecker ex = new IntegrityChecker();

		ex.init();

		f.add("Center", ex);

		f.setBounds(0,0, 960,800);

		f.show();
	}

	public void init() {	
		
		Collections.shuffle(userAgents);
		
		//Pick a random user agent string
		String userAgent = userAgents.get(0);

		//Set the user agent to the user agent of the browser
		System.setProperty("http.agent", userAgent);

		out.append("User Agent : " + System.getProperty("http.agent") + "\n");

		this.setLayout(new BorderLayout());

	
		Panel panel = new Panel();
		
		final TextField identifierField = new TextField("demo-account");
		
		panel.add(identifierField);
		
		 // STEP 1: Compose the GUI 
	    Button ok = new Button("Run");  
	    
		panel.add(ok);

	    add(panel, BorderLayout.NORTH); 
	 
	    // STEP 2: Setup Event handlers 
	    ok.addActionListener(new ActionListener() {
	    	public void actionPerformed(ActionEvent event) { 
	    		Thread thread = new Thread() {
	    			public void run() {
	    				verifyIdentifier(identifierField.getText());
	    			}
	    		};  

	    		thread.start();
	    	  } 
	    }); 
	    
		this.add(out, BorderLayout.CENTER);
	}

	public void verifyIdentifier(String identifier) {

		String URL = blockchainBaseURL + "/" + identifier;

		out.append("Verifying URL: " + URL + "\n");

		verifyURL(URL);
	}

	public String downloadResource(String urlString) throws IOException {
		final URL url = new URL(urlString);

		return AccessController.doPrivileged(new PrivilegedAction<String>() {
			public String run() {								
				try {

					HttpURLConnection connection = (HttpURLConnection) url.openConnection();

					connection.setConnectTimeout(30000);

					connection.setInstanceFollowRedirects(true);

					connection.connect();

					try {
						if (connection.getResponseCode() != 200) {
							throw new IOException("Invalid http response code " + connection.getResponseCode());
						}

						return IOUtils.toString(connection.getInputStream(), "UTF-8");
					} finally {
						connection.disconnect();
					}

				} catch (Exception e) {	
					e.printStackTrace();
				}

				return null;
			}
		});
	}

	public void verifyfile(String src) {
		try {
			String fullPath = blockchainResources + src;
			String githubPath = githubBaseURL + src;

			out.append("Verifying Script " + fullPath + " with " + githubPath + "\n");

			String blockchainResponse = downloadResource(fullPath);
			String githubResponse = downloadResource(githubPath);

			String blockchainLines[] = blockchainResponse.split("\\n");
			String githubLines[] = githubResponse.split("\\n");

			boolean error = false;

			if (blockchainLines.length != githubLines.length) {
				out.append("	*** Warning: Different number of lines in each file ("+blockchainLines.length+", " + githubLines.length + ")\n");

				error = true;
			}

			for (int ii = 0; ii < blockchainLines.length && ii < githubLines.length; ++ii) {
				if (!blockchainLines[ii].equals(githubLines[ii])) {
					out.append("	***  Discrepency on line number: " + ii + "\n");
					error = true;
				}
			}

			if (error) {
				out.append("	*** Error verifying : " + src + " please notify support@pi.uk.com\n");
			} else {
				out.append("Script : " + src + " OK!\n\n");
			}
		} catch (Exception e) {
			out.append("	*** Exception caught verifying : " + src + " " + e.getLocalizedMessage() + "\n");
		}
	}

	public void verifyURL(String urlString) {
		try {

			TrustManagerFactory trustManagerFactory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());  
			KeyStore keystore = KeyStore.getInstance(KeyStore.getDefaultType());  
			InputStream keystoreStream = ClassLoader.getSystemResourceAsStream("jssecacerts");  
			keystore.load(keystoreStream, null);  
			trustManagerFactory.init(keystore);  
			TrustManager[] trustManagers = trustManagerFactory.getTrustManagers();  
			SSLContext sc = SSLContext.getInstance("SSL");  
			sc.init(null, trustManagers, null);  
			HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());  
			SSLContext.setDefault(sc); 

			out.append("Download resource...\n");

			String response = downloadResource(urlString);

			Document document = Jsoup.parse(response); //Strip and html 

			Executor exec = Executors.newSingleThreadExecutor(); 

			String[] jsattrs = {
					"onmousedown", 
					"onmouseup", 
					"onclick",
					"ondblclick",
					"onmouseover",
					"onmouseout",
					"onmousemove",
					"onkeydown",
					"onkeyup",
					"onkeypress",
					"onfocus",
					"onblur",
					"onload",
					"onunload",
					"onabort",
					"onerror",
					"onsubmit",
					"onreset",
					"onchange",
					"onselect",
					"oninput",
					"onpaint",
					"ontext",
					"onpopupShowing",
					"onpopupShown",
					"onpopupHiding",
					"onpopupHidden",
					"onclose",
					"oncommand",
					"onbroadcast",
					"oncommandupdate",
					"ondragenter",
					"ondragover",
					"ondragexit",
					"ondragdrop",
					"ondraggesture",
					"onresize",
					"onscroll",
					"overflow",
					"onoverflowchanged",
					"onunderflow",
					"onoverflowchanged",
					"onsubtreemodified",
					"onnodeinserted",
					"onnoderemoved",
					"onnoderemovedfromdocument",
					"onnodeinsertedintodocument",
					"onattrmodified",
					"oncharacterdatamodified"
			};

			for (String attr : jsattrs) {
				//Check for any inline javascript
				List<Element> jsel = document.getElementsByAttribute(attr);

				for (Element js : jsel) {
					System.out.println("*** Warning inline javascript found: " + js.attributes());
					System.out.println("*** This should not be here. Please contact support@pi.uk.com");

				}
			}

			List<Element> embeds = document.getElementsByTag("embed");
			for (Element embed : embeds) {
				out.append("*** Error found embed tag which is disallowed");
				out.append(embed.html());
			}

			List<Element> objects = document.getElementsByTag("object");
			for (Element object : objects) {
				out.append("*** Error found an object tag which is disallowed");
				out.append(object.html());
			}

			//Loop through all the script tags and check the contents again github
			List<Element> scriptTags = document.getElementsByTag("script");

			out.append("Found " + scriptTags.size() + " external scripts:\n\n");

			for (Element scriptTag : scriptTags) {
				final String src = scriptTag.attr("src");

				if (src == null || src.length() == 0) {
					//throw new Exception("Inlined javascript not allowed");

					Frame window = new Frame();

					// Create a modal dialog
					final Dialog d = new Dialog(window, "Alert", false);

					// Use a flow layout
					d.setLayout( new BorderLayout() );

					// Create an OK button
					Button ok = new Button ("OK");
					ok.addActionListener ( new ActionListener()
					{
						public void actionPerformed( ActionEvent e )
						{
							// Hide dialog
							d.setVisible(false);
						}
					});

					d.addWindowListener(new WindowAdapter() {  
						@Override  
						public void windowClosing(WindowEvent e) {  
							d.setVisible(false);
						}  
					});  

					TextArea out = new TextArea();

					out.append("Please Verify this javascript is not malicious: \n\n");

					out.append(scriptTag.html());

					d.add(out);

					// Show dialog
					d.pack();
					d.setVisible(true);

					d.setSize(800,400);

					continue;
				}

				URI uri = new URI(src);

				String scheme = uri.getScheme();

				//If the scheme is null then it is a relative path
				if (scheme == null) {

					final String name = src.replace("/Resources/wallet", "");

					exec.execute(new Runnable() {
						public void run() {
							verifyfile(name);
						}
					});

				} else if (scheme.equals("https")) {
					String host = uri.getHost();

					//We download jQuery from google (It is assumed google will not be hacked :)
					if (host.equals("google.com") || host.equals("ajax.googleapis.com")) {
						out.append("Trusted script from " + host + " not verifying...\n\n");
					} else {
						throw new Exception("Unknown script from " + host);
					}

				} else {
					throw new Exception("Invalid protocol " + scheme);
				}
			}

		} catch (Exception e) {

			out.append("Fatal Error: " + e.getLocalizedMessage() + "\n");

			e.printStackTrace(); 
		}
	}
}
