import { useState } from "react";
import api from "../../lib/api";
import { buildEmailTemplate } from "../../utils/emailTemplate";

const SendEmail = () => {

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("standard");
  const [regards, setRegards] = useState("");

  const [buttonText, setButtonText] = useState("");
  const [buttonLink, setButtonLink] = useState("");

  const [loading, setLoading] = useState(false);
  const [success,setSuccess] = useState(null);

  const handleSend = async (e) => {

    e.preventDefault();

    setLoading(true);

        const htmlBody = buildEmailTemplate({
        name,
        title,
        subtitle,
        message,
        type,
        buttonText,
        buttonLink,
        regards
        });

    try {

      await api.post("/api/staff/send-email",{
        to: email,
        subject: title,
        html: htmlBody
      });

      setSuccess("Email sent successfully");

    } catch(err){

      alert("Failed to send email");

    }

    setLoading(false);
  };

  return (

<div className="card shadow-lg border-0">

<div className="card-header bg-primary text-white">
<h4 className="mb-0">Send Email</h4>
</div>

<div className="card-body">

<form onSubmit={handleSend} className="row g-3">

<div className="col-md-6">
<label>Email</label>
<input className="form-control"
value={email}
onChange={e=>setEmail(e.target.value)}
required
/>
</div>

<div className="col-md-6">
<label>Name</label>
<input className="form-control"
value={name}
onChange={e=>setName(e.target.value)}
required
/>
</div>

<div className="col-md-6">
<label>Title</label>
<input className="form-control"
value={title}
onChange={e=>setTitle(e.target.value)}
required
/>
</div>

<div className="col-md-6">
<label>Email Type</label>

<select
className="form-select"
value={type}
onChange={e=>setType(e.target.value)}
>

<option value="standard">Standard</option>
<option value="positive">Positive</option>
<option value="warning">Warning</option>
<option value="negative">Negative</option>

</select>
</div>

<div className="col-md-12">
<label>Subtitle</label>
<input
className="form-control"
value={subtitle}
onChange={e=>setSubtitle(e.target.value)}
/>
</div>

<div className="col-md-12">
<label>Message</label>

<textarea
className="form-control"
rows="6"
value={message}
onChange={e=>setMessage(e.target.value)}
required
/>
</div>

<hr className="mt-4"/>

<h6>Optional Button</h6>

<div className="col-md-6">
<input
className="form-control"
placeholder="Button Text"
value={buttonText}
onChange={e=>setButtonText(e.target.value)}
/>
</div>

<div className="col-md-6">
<input
className="form-control"
placeholder="Button Link"
value={buttonLink}
onChange={e=>setButtonLink(e.target.value)}
/>
</div>

<div className="col-12 text-center mt-4">

    <div className="col-md-12">
<label>Custom Regards (Optional)</label>

<textarea
className="form-control"
rows="2"
placeholder="Example: Kind regards, Admissions Office"
value={regards}
onChange={(e)=>setRegards(e.target.value)}
/>
</div>

<button
className="btn btn-primary px-5"
disabled={loading}
>

{loading ? "Sending..." : "Send Email"}

</button>

</div>

</form>

{success && (
<div className="alert alert-success mt-3">
{success}
</div>
)}

</div>
</div>

  );
};

export default SendEmail;