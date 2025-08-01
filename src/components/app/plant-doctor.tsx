'use client';

import { handleDiagnose, handleRecommend } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, ArrowRight, Bot, CheckCircle, Leaf, Pill, Sparkles, UploadCloud, XCircle, TestTube2, Sprout, Info } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, useTransition } from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Diagnosis = {
  diseaseName: string;
  confidence: number;
  description: string;
};

type Treatment = {
  chemicalTreatment: string;
  biologicalTreatment: string;
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
  const [showUploader, setShowUploader] = useState(true);

  const resetState = useCallback(() => {
    setError(null);
    setImagePreview(null);
    setDiagnosis(null);
    setTreatment(null);
    setShowUploader(true);
  }, []);

  const onGetTreatment = useCallback((diag: Diagnosis) => {
    if (!diag) return;
    startTreatmentTransition(async () => {
      const result = await handleRecommend(diag.diseaseName, diag.description);
      if ('error' in result) {
        setError(result.error);
        toast({
          variant: "destructive",
          title: "Đề xuất thất bại",
          description: result.error,
        });
      } else {
        setTreatment(result);
      }
    });
  }, [startTreatmentTransition, toast]);


  const onDiagnose = (file: File) => {
    resetState();
    setShowUploader(false);
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
            title: "Chẩn đoán thất bại",
            description: result.error,
          });
          setShowUploader(true);
        } else {
          setDiagnosis(result);
          onGetTreatment(result);
        }
      });
    };
    reader.onerror = (error) => {
      console.error('Lỗi đọc tệp:', error);
      setError('Không thể đọc tệp ảnh.');
       toast({
        variant: "destructive",
        title: "Lỗi tệp",
        description: 'Đã có sự cố khi đọc tệp ảnh của bạn.',
      });
      setShowUploader(true);
    };
  };

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
        console.error("Không thể lưu bản ghi vào bộ nhớ cục bộ:", e);
      }
    }
  }, [diagnosis, treatment, imagePreview]);

  const isLoading = isDiagnosisPending || isTreatmentPending;

  return (
    <div className="space-y-8">
      {showUploader ? (
         <Card className="overflow-hidden shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Leaf className="text-primary w-6 h-6" />
              </div>
              <span className="text-xl font-semibold">Bắt đầu chẩn đoán</span>
            </CardTitle>
            <CardDescription>Tải lên ảnh rõ nét của bộ phận cây bị bệnh để AI phân tích.</CardDescription>
          </CardHeader>
          <CardContent>
            <ImageUploader onDiagnose={onDiagnose} isPending={isDiagnosisPending} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Ảnh đã tải lên</CardTitle>
              </CardHeader>
              <CardContent>
                {imagePreview && (
                   <Image src={imagePreview} alt="Xem trước cây trồng" width={300} height={300} className="rounded-lg object-cover w-full shadow-md" data-ai-hint="plant disease" />
                )}
              </CardContent>
            </Card>
            <div className="text-center">
              <Button variant="outline" onClick={resetState} disabled={isLoading}>
                {isLoading ? 'Đang xử lý...' : 'Bắt đầu chẩn đoán mới'}
              </Button>
            </div>
          </div>
          
          <div className="md:col-span-2 space-y-8">
            <Card className="overflow-hidden shadow-lg">
               <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Bot className="text-primary w-5 h-5" />
                  </div>
                  <span>Chẩn đoán của AI</span>
                </CardTitle>
              </CardHeader>
              {isDiagnosisPending ? <DiagnosisSkeleton /> : diagnosis ? <DiagnosisResult diagnosis={diagnosis} /> : null}
            </Card>

            <Card className="overflow-hidden shadow-lg">
               <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Sparkles className="text-primary w-5 h-5" />
                  </div>
                  <span>Kế hoạch điều trị</span>
                </CardTitle>
              </CardHeader>
              {isTreatmentPending ? <TreatmentSkeleton /> : treatment ? <TreatmentPlan treatment={treatment} /> : (isDiagnosisPending ? <Skeleton className="h-4 w-48 mx-6 mb-6"/> : <CardContent><p className="text-muted-foreground">Đang chờ kết quả chẩn đoán...</p></CardContent>)}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function ImageUploader({ onDiagnose, isPending }: { onDiagnose: (file: File) => void, isPending: boolean }) {
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
    <div 
      className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors bg-primary/5"
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
        <div className="bg-primary/10 p-4 rounded-full">
          <UploadCloud className="h-8 w-8 text-primary" />
        </div>
        <p className="font-semibold text-muted-foreground">Kéo và thả ảnh vào đây</p>
        <p className="text-muted-foreground/80">hoặc</p>
        <Button disabled={isPending}>Nhấp để chọn tệp</Button>
        <p className="text-xs text-muted-foreground/80 mt-2">Hỗ trợ PNG, JPG, và WEBP</p>
      </div>
    </div>
  );
}

function DiagnosisResult({ diagnosis }: { diagnosis: Diagnosis }) {
  const confidencePercent = Math.round(diagnosis.confidence * 100);
  
  const getConfidenceBadgeVariant = (confidence: number) => {
    if (confidence > 75) return "success";
    if (confidence > 50) return "warning";
    return "destructive";
  };
  
  const getConfidenceIcon = (confidence: number) => {
    if (confidence > 75) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (confidence > 50) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  }

  return (
    <CardContent className="space-y-4">
      <Alert variant={confidencePercent < 50 ? 'destructive' : 'default'} className="bg-card">
        {getConfidenceIcon(confidencePercent)}
        <AlertTitle className="font-bold text-lg">{diagnosis.diseaseName}</AlertTitle>
        <AlertDescription>
          AI đã xác định bệnh này với độ tin cậy là {confidencePercent}%.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-4">
        <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Mô tả chi tiết
            </h4>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap pl-7">{diagnosis.description}</p>
        </div>

        <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Mức độ tin cậy
            </h4>
            <div className="flex items-center gap-3 pl-7">
                <Progress value={confidencePercent} className="w-full h-3" />
                <Badge variant="outline" className="text-lg font-bold">{confidencePercent}%</Badge>
            </div>
        </div>
      </div>
    </CardContent>
  );
}


function TreatmentPlan({ treatment }: { treatment: Treatment }) {
  return (
    <CardContent className="space-y-6">
      <div className="space-y-2">
        <h4 className="font-semibold text-lg flex items-center gap-3"><div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg"><TestTube2 className="text-blue-600 dark:text-blue-400 h-5 w-5" /></div> <span>Điều trị hóa học</span></h4>
        <p className="text-muted-foreground whitespace-pre-wrap pl-12">{treatment.chemicalTreatment}</p>
      </div>
       <div className="space-y-2">
        <h4 className="font-semibold text-lg flex items-center gap-3"><div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg"><Sprout className="text-green-600 dark:text-green-400 h-5 w-5" /></div> <span>Điều trị sinh học</span></h4>
        <p className="text-muted-foreground whitespace-pre-wrap pl-12">{treatment.biologicalTreatment}</p>
      </div>
      <div className="space-y-2">
        <h4 className="font-semibold text-lg flex items-center gap-3"><div className="bg-primary/10 p-2 rounded-lg"><Pill className="text-primary h-5 w-5" /></div> <span>Thuốc được đề xuất</span></h4>
        <p className="text-muted-foreground whitespace-pre-wrap pl-12">{treatment.suggestedMedicines}</p>
      </div>
    </CardContent>
  );
}


function DiagnosisSkeleton() {
  return (
    <CardContent className="space-y-6 pt-6">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/4 mb-4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </CardContent>
  );
}

function TreatmentSkeleton() {
  return (
    <CardContent className="space-y-8 pt-6">
      <div className="space-y-3">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </CardContent>
  );
}
