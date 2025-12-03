"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/client/firebase'; // CLIENT SDK voor data lezen!
import { updatePostAction } from './actions'; // Importeer de server action

import { useFormState } from 'react-dom';
import { Toaster, toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { AffiliateProducts } from '@/components/AffiliateProducts'; // Zorg dat dit pad klopt

// ... (interfaces voor AmazonProduct, WishlistItem blijven hetzelfde) ...

// Dynamisch importeren van ReactQuill
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

interface WishlistItem {
  id: string;
  title: string;
  image?: string;
  description: string;
  url?: string;
  price?: string;
}

interface PostSection {
  subTitle: string;
  content: string;
  items: WishlistItem[];
}


export default function UpdatePostPage() {
  const params = useParams();
  const id = params.id as string;

  // Form state voor de server action
  const [state, formAction] = useFormState(updatePostAction, { error: null });

  // Lokale state voor de formulier velden
  const [headTitle, setHeadTitle] = useState('');
  const [headDescription, setHeadDescription] = useState('');
  const [headImage, setHeadImage] = useState('');
  const [subDescription, setSubDescription] = useState('');
  const [sections, setSections] = useState<PostSection[]>([{ subTitle: '', content: '', items: [] }]);
  const [isLoading, setIsLoading] = useState(true);

  // Post data laden (dit blijft client-side voor het vullen van de form)
  useEffect(() => {
    if (!id) return;
    const loadPostData = async () => {
      setIsLoading(true);
      try {
        const postRef = doc(db, 'posts', id);
        const snap = await getDoc(postRef);
        if (snap.exists()) {
          const post = snap.data();
          setHeadTitle(post.headTitle || '');
          setHeadDescription(post.headDescription || '');
          setHeadImage(post.headImage || '');
          setSubDescription(post.subDescription || '');
          setSections(post.sections || []);
        } else {
          toast.error("Post niet gevonden!");
        }
      } catch (error) {
          toast.error("Fout bij het laden van de post.");
      } finally {
          setIsLoading(false);
      }
    };
    loadPostData();
  }, [id]);

  useEffect(() => {
    if (state?.error) {
        toast.error(state.error);
    }
  }, [state]);

  // ... (je functies zoals addSection, removeSection, etc. blijven hier) ...
  // Zorg ervoor dat ze correct de state aanpassen (je huidige code daarvoor is prima)

  if (isLoading) {
    return <div>Post aan het laden...</div>;
  }

  return (
    <>
      <Toaster richColors />
      <form action={formAction} className="w-full max-w-4xl p-8 mx-auto space-y-6 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl font-semibold text-center">Update Post</h1>
        
        {/* Verborgen velden die de action nodig heeft */}
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="headImage" value={headImage} />
        <input type="hidden" name="sections" value={JSON.stringify(sections)} />

        <div>
          <label htmlFor="headTitle" className="block text-sm font-medium">Titel</label>
          <input
            id="headTitle"
            name="headTitle"
            value={headTitle}
            onChange={(e) => setHeadTitle(e.target.value)}
            className="w-full mt-1 p-2 border rounded"
            required
          />
        </div>

        <div>
            <label className="block text-sm font-medium">Beschrijving</label>
            {/* ReactQuill kan niet direct met een name prop werken, dus we gebruiken een hidden input */}
            <input type="hidden" name="headDescription" value={headDescription} />
            <ReactQuill theme="snow" value={headDescription} onChange={setHeadDescription} />
        </div>
        
        {/* ... rest van je JSX voor de formulier velden ... */}
        {/* De file upload logica moet ook naar een server action voor veiligheid! */}

        {/* Voor nu laat ik de rest van je formulier logica staan */}
        {/* De 'updatePost' functie wordt vervangen door de submit knop */}
        
        <button type="submit" className="mt-6 w-full py-3 bg-blue-600 text-white rounded-lg">
          Post updaten
        </button>
      </form>
    </>
  );
}