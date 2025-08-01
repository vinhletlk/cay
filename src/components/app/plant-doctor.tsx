'use client';

import { handleDiagnose, handleRecommend } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, ArrowRight, Bot, CheckCircle, Leaf, Sparkles, UploadCloud, XCircle } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';

type Diagnosis = {
  diseaseName: string;
  confidence: number;
  description: string;
};

type Treatment = {
  treatmentRecommendation: string;
  suggestedMedicines: string;
};

type PlantRecord = {
  id: string;
  date: string;
  image: string;
  diagnosis: Diagnosis;
  treatment: Treatment;
}

export function PlantDoctor() {
  const { toast } = useToast();
  const [isDiagnosisPending, startDiagnosisTransition] = useTransition();
  const [isTreatmentPending, startTreatmentTransition] = useTransition();
  
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [treatment, setTreatment] = useState<Treatment | null>(null);

  const resetState = useCallback(() => {
    setError(null);
    setImagePreview(null);
    setDiagnosis(null);
    setTreatment(null);
  }, []);

  const onDiagnose = (file: File) => {
    resetState();
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const dataUri = reader.result as string;
      setImagePreview(dataUri);
      startDiagnosisTransition(async () => {
        const result = await handleDiagnose(dataUri);
        if ('error' in result) {
          setError(result.error);
          toast({
            variant: "destructive",
            title: "Diagnosis Failed",
            description: result.error,
          });
        } else {
          setDiagnosis(result);
        }
      });
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      setError('Failed to read the image file.');
       toast({
        variant: "destructive",
        title: "File Error",
        description: 'There was an issue reading your image file.',
      });
    };
  };

  const onGetTreatment = () => {
    if (!diagnosis) return;
    startTreatmentTransition(async () => {
      const result = await handleRecommend(diagnosis.diseaseName, diagnosis.description);
      if ('error' in result) {
        setError(result.error);
        toast({
          variant: "destructive",
          title: "Recommendation Failed",
          description: result.error,
        });
      } else {
        setTreatment(result);
      }
    });
  }

  // Save record to local storage when treatment is available
  useEffect(() => {
    if (diagnosis && treatment && imagePreview) {
      try {
        const newRecord: PlantRecord = {
          id: new Date().toISOString(),
          date: new Date().toLocaleDateString(),
          image: imagePreview,
          diagnosis,
          treatment,
        };
        const existingRecords = JSON.parse(localStorage.getItem('plant_doctor_history') || '[]');
        const updatedRecords = [newRecord, ...existingRecords];
        localStorage.setItem('plant_doctor_history', JSON.stringify(updatedRecords));
      } catch (e) {
        console.error("Failed to save record to local storage:", e);
      }
    }
  }, [diagnosis, treatment, imagePreview]);

  const isLoading = isDiagnosisPending || isTreatmentPending;

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="text-primary" />
            <span>1. Upload Plant Image</span>
          </CardTitle>
          <CardDescription>Upload a clear photo of the affected plant part for AI analysis.</CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUploader onDiagnose={onDiagnose} isPending={isDiagnosisPending} imagePreview={imagePreview} />
        </CardContent>
      </Card>
      
      {isDiagnosisPending && <DiagnosisSkeleton />}
      
      {diagnosis && (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="text-primary" />
              <span>2. AI Diagnosis</span>
            </CardTitle>
            <CardDescription>Our AI has analyzed your image. Here are the results.</CardDescription>
          </CardHeader>
          <DiagnosisResult diagnosis={diagnosis} onGetTreatment={onGetTreatment} isPending={isTreatmentPending} />
        </Card>
      )}

      {isTreatmentPending && <TreatmentSkeleton />}
      
      {treatment && (
         <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="text-primary" />
              <span>3. Treatment Plan</span>
            </CardTitle>
            <CardDescription>Follow these recommendations to help your plant recover.</CardDescription>
          </CardHeader>
          <TreatmentPlan treatment={treatment} />
        </Card>
      )}

      {(diagnosis || imagePreview) && !isLoading && (
        <div className="text-center">
          <Button variant="outline" onClick={resetState}>Start New Diagnosis</Button>
        </div>
      )}
    </div>
  );
}

function ImageUploader({ onDiagnose, isPending, imagePreview }: { onDiagnose: (file: File) => void, isPending: boolean, imagePreview: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onDiagnose(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onDiagnose(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div>
      <div 
        className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:bg-muted transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isPending}
        />
        <div className="flex flex-col items-center gap-4">
          <UploadCloud className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Drag & drop an image here, or click to select a file</p>
        </div>
      </div>
      {imagePreview && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Image Preview:</h3>
          <Image src={imagePreview} alt="Plant preview" width={200} height={200} className="rounded-lg object-cover" data-ai-hint="plant disease" />
        </div>
      )}
    </div>
  );
}

function DiagnosisResult({ diagnosis, onGetTreatment, isPending }: { diagnosis: Diagnosis, onGetTreatment: () => void, isPending: boolean }) {
  const confidencePercent = Math.round(diagnosis.confidence * 100);
  const confidenceColor = confidencePercent > 75 ? 'text-green-600' : confidencePercent > 50 ? 'text-yellow-600' : 'text-red-600';

  return (
    <>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg">{diagnosis.diseaseName}</h3>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">Confidence Level:</p>
            <p className={`font-bold text-lg ${confidenceColor}`}>{confidencePercent}%</p>
          </div>
          <Progress value={confidencePercent} className="w-full h-2 mt-1" />
        </div>
        <div>
          <h4 className="font-semibold">Description</h4>
          <p className="text-muted-foreground whitespace-pre-wrap">{diagnosis.description}</p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onGetTreatment} disabled={isPending} style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} className="hover:opacity-90">
          {isPending ? 'Generating...' : 'Get Treatment Plan'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </>
  );
}

function TreatmentPlan({ treatment }: { treatment: Treatment }) {
  return (
    <CardContent className="space-y-6">
      <div>
        <h4 className="font-semibold text-lg flex items-center gap-2"><CheckCircle className="text-primary h-5 w-5" /> Recommended Treatment</h4>
        <p className="text-muted-foreground whitespace-pre-wrap mt-2 pl-7">{treatment.treatmentRecommendation}</p>
      </div>
      <div>
        <h4 className="font-semibold text-lg flex items-center gap-2"><XCircle className="text-primary h-5 w-5" /> Suggested Medicines</h4>
        <p className="text-muted-foreground whitespace-pre-wrap mt-2 pl-7">{treatment.suggestedMedicines}</p>
      </div>
    </CardContent>
  );
}


function DiagnosisSkeleton() {
  return (
    <Card>
      <CardHeader>
         <CardTitle className="flex items-center gap-2">
              <Bot className="text-primary" />
              <span>AI Diagnosis</span>
            </CardTitle>
        <CardDescription>Our AI is analyzing your image. Please wait a moment.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
    </Card>
  );
}

function TreatmentSkeleton() {
  return (
     <Card>
      <CardHeader>
         <CardTitle className="flex items-center gap-2">
              <Sparkles className="text-primary" />
              <span>Treatment Plan</span>
            </CardTitle>
        <CardDescription>Generating a personalized treatment plan for your plant...</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
         <div className="space-y-2">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </CardContent>
    </Card>
  );
}
